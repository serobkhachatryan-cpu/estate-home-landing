#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const HOUR_MS = 60 * 60 * 1000;
const EPSILON = 0.001;
const SOURCES_PER_REQUEST = 12;

function usage(message) {
  if (message) console.error(`Error: ${message}\n`);
  console.error(
    'Usage: node scripts/import-home-assistant-sensors.mjs --db <recorder.db> --entity-registry <core.entity_registry> --device-registry <core.device_registry> --area-registry <core.area_registry> --endpoint http://127.0.0.1:3001 [--timezone Europe/London]',
  );
  process.exitCode = 1;
}

function parseArguments(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const name = argv[index];
    const value = argv[index + 1];
    if (!name?.startsWith('--') || !value || value.startsWith('--')) {
      usage('Arguments must be supplied as --name value pairs.');
      return null;
    }
    values.set(name.slice(2), value);
  }

  const required = [
    'db',
    'entity-registry',
    'device-registry',
    'area-registry',
    'endpoint',
  ];
  if (required.some((key) => !values.get(key))) {
    usage(`The --${required.join(', --')} arguments are required.`);
    return null;
  }

  return {
    db: values.get('db'),
    entityRegistry: values.get('entity-registry'),
    deviceRegistry: values.get('device-registry'),
    areaRegistry: values.get('area-registry'),
    endpoint: values.get('endpoint').replace(/\/$/, ''),
    timezone: values.get('timezone') ?? 'Europe/London',
  };
}

function finite(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function round(value, digits = 3) {
  const scale = 10 ** digits;
  return Math.round((value + Number.EPSILON) * scale) / scale;
}

function dateFormatter(timezone) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function timeFormatter(timezone) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
}

function dayFor(timestamp, formatter) {
  const parts = formatter.formatToParts(new Date(timestamp));
  const part = (type) => parts.find((entry) => entry.type === type)?.value;
  const year = part('year');
  const month = part('month');
  const day = part('day');
  if (!year || !month || !day) throw new Error('Could not derive local calendar day.');
  return `${year}-${month}-${day}`;
}

function isLocalMidnight(timestamp, formatter) {
  const parts = formatter.formatToParts(new Date(timestamp));
  const part = (type) => parts.find((entry) => entry.type === type)?.value;
  return part('hour') === '00' && part('minute') === '00';
}

function arrayField(value) {
  return Array.isArray(value) ? value : [];
}

function firstText(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function humanize(value) {
  return value
    .replace(/^sensor\./, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}

function shortHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).toUpperCase().padStart(4, '0').slice(-4);
}

function loadRegistry(paths) {
  const entities = JSON.parse(readFileSync(paths.entityRegistry, 'utf8'));
  const devices = JSON.parse(readFileSync(paths.deviceRegistry, 'utf8'));
  const areas = JSON.parse(readFileSync(paths.areaRegistry, 'utf8'));

  const areaNames = new Map(
    arrayField(areas.data?.areas).map((area) => [area.id, area.name]),
  );
  const deviceRecords = new Map(
    arrayField(devices.data?.devices).map((device) => [device.id, device]),
  );
  const entityRecords = new Map(
    arrayField(entities.data?.entities).map((entity) => [entity.entity_id, entity]),
  );

  return { areaNames, deviceRecords, entityRecords };
}

function classifySource({ entityId, label, deviceLabel, unit, unitClass }) {
  const text = `${entityId} ${label ?? ''} ${deviceLabel ?? ''}`.toLowerCase();
  const has = (pattern) => pattern.test(text);

  // These checks intentionally precede Home Assistant device classes. A fuel
  // tank may be tagged as volume/water, while it is not a water-consumption
  // meter. The dashboard must never add either category together.
  if (has(/(?:fuel_tank|fuel tank|oil tank|diesel tank)/)) {
    return { id: 'fuel', label: 'Fuel & resilience' };
  }
  if (has(/(?:printer|toner|drum|cartridge)/)) {
    return { id: 'care', label: 'Care & supplies' };
  }
  if (
    has(
      /(?:nvr|camera|intercom|recording|timelapse|detection|disk.write|storage.used)/,
    ) ||
    /sensor\.(?:house_(?:basement|garage|loft|pool)_battery|lodge_battery|office_battery)$/.test(
      entityId,
    )
  ) {
    return { id: 'security', label: 'Security & recording' };
  }
  // The weather-station voltage sensors are environmental context, while a
  // Shelly device temperature belongs with its own electrical feeder.
  if (entityId.startsWith('sensor.hp2564ae_pro_v2_0_9_')) {
    return { id: 'climate', label: 'Climate & weather' };
  }
  if (has(/(?:signal strength|signal_strength)/)) {
    return { id: 'network', label: 'Network & infrastructure' };
  }
  if (
    has(/(?:shelly|ups|battery_charge|tank_input_voltage)/) ||
    /sensor\.(?:lodge_load|office_load)$/.test(entityId)
  ) {
    return { id: 'power', label: 'Power & electricity' };
  }
  if (
    has(/(?:starlink|network|cpu|memory|poe|switch|uplink|downlink|ping|signal|disk)/)
  ) {
    return { id: 'network', label: 'Network & infrastructure' };
  }
  if (
    has(/(?:weather|outdoor|indoor|dewpoint|wind|rain|solar|uv|humidity|temperature|pressure|illuminance|lux|feels.like|windchill)/) ||
    ['temperature', 'pressure', 'speed'].includes(unitClass ?? '') ||
    unit === '°C' ||
    unit === 'hPa' ||
    unit === 'lx'
  ) {
    return { id: 'climate', label: 'Climate & weather' };
  }
  if (
    has(/(?:water|flow)/) ||
    unitClass === 'volume_flow_rate' ||
    (unitClass === 'volume' && !has(/(?:fuel|oil|tank)/))
  ) {
    return { id: 'water', label: 'Water' };
  }
  if (
    has(/(?:shelly|electric|power|energy|voltage|current|plug|ups|phase|garage input|house input|office input)/) ||
    ['power', 'energy', 'voltage', 'electric_current', 'apparent_power'].includes(
      unitClass ?? '',
    ) ||
    ['W', 'kWh', 'V', 'A', 'VA', 'GBP'].includes(unit ?? '')
  ) {
    return { id: 'power', label: 'Power & electricity' };
  }
  return { id: 'sensors', label: 'Other sensors' };
}

function safeDisplayLabel({ entityId, label, groupId }) {
  const lower = entityId.toLowerCase();
  if (groupId === 'network' && /(?:cpu|memory|poe|switch)/.test(lower)) {
    const metric = lower.includes('cpu')
      ? 'CPU'
      : lower.includes('memory')
        ? 'Memory'
        : lower.includes('poe')
          ? 'PoE power'
          : 'Network health';
    return `Network source ${shortHash(entityId)} · ${metric}`;
  }
  return label || humanize(entityId);
}

function metadataRows(db) {
  return db
    .prepare(
      `SELECT id, statistic_id, unit_of_measurement, unit_class, has_sum, name
       FROM statistics_meta
       ORDER BY statistic_id ASC`,
    )
    .all();
}

function currentStateEntityIds(db) {
  return new Set(
    db.prepare('SELECT entity_id FROM states_meta').all().map((row) => row.entity_id),
  );
}

function rowsForStatistic(db, metadataId) {
  return db
    .prepare(
      `SELECT start_ts AS timestamp, mean, min, max, state, sum
       FROM statistics
       WHERE metadata_id = ?
       ORDER BY start_ts ASC`,
    )
    .all(metadataId)
    .map((row) => ({
      timestamp: Number(row.timestamp) * 1000,
      mean: finite(row.mean),
      minimum: finite(row.min),
      maximum: finite(row.max),
      state: finite(row.state),
      sum: finite(row.sum),
    }));
}

/**
 * Meters are never added to one another. The importer emits one source per
 * Home Assistant statistic ID and only turns a consecutive, non-negative
 * state segment into consumption. Water deliberately uses state, not HA's
 * historical sum column, because this archive has known divergent water sums.
 */
function normalizeDailyTotal(rows, timezone, useStateOnly) {
  const formatter = dateFormatter(timezone);
  const clock = timeFormatter(timezone);
  const days = new Map();
  let invalidIntervals = 0;

  for (let index = 1; index < rows.length; index += 1) {
    const previous = rows[index - 1];
    const current = rows[index];
    const day = dayFor(current.timestamp - 1, formatter);
    const bucket = days.get(day) ?? {
      day,
      startTimestamp: previous.timestamp,
      endTimestamp: current.timestamp,
      intervals: 0,
      invalid: false,
      value: 0,
    };
    bucket.endTimestamp = current.timestamp;

    const elapsed = current.timestamp - previous.timestamp;
    const stateDelta =
      previous.state == null || current.state == null
        ? null
        : current.state - previous.state;
    const sumDelta =
      previous.sum == null || current.sum == null ? null : current.sum - previous.sum;
    const valid =
      elapsed === HOUR_MS &&
      stateDelta != null &&
      stateDelta >= -EPSILON &&
      (useStateOnly ||
        (sumDelta != null &&
          sumDelta >= -EPSILON &&
          Math.abs(sumDelta - stateDelta) <= EPSILON));
    if (!valid) {
      bucket.invalid = true;
      invalidIntervals += 1;
    } else {
      bucket.intervals += 1;
      bucket.value += stateDelta;
    }
    days.set(day, bucket);
  }

  let invalidDays = 0;
  const daily = [...days.values()]
    .filter((bucket) => {
      const complete =
        !bucket.invalid &&
        bucket.intervals >= 23 &&
        bucket.intervals <= 25 &&
        isLocalMidnight(bucket.startTimestamp, clock) &&
        isLocalMidnight(bucket.endTimestamp, clock);
      if (!complete) invalidDays += 1;
      return complete;
    })
    .map((bucket) => ({
      day: bucket.day,
      value: round(bucket.value),
      minimum: null,
      maximum: null,
      sampleCount: bucket.intervals,
    }))
    .sort((left, right) => left.day.localeCompare(right.day));

  return { daily, invalidIntervals, invalidDays };
}

function normalizeDailyAverage(rows, timezone) {
  const formatter = dateFormatter(timezone);
  const clock = timeFormatter(timezone);
  const days = new Map();
  let invalidIntervals = 0;

  for (const row of rows) {
    const day = dayFor(row.timestamp - 1, formatter);
    const bucket = days.get(day) ?? {
      day,
      startTimestamp: row.timestamp - HOUR_MS,
      endTimestamp: row.timestamp,
      samples: 0,
      invalid: false,
      valueTotal: 0,
      minimum: null,
      maximum: null,
      previousTimestamp: null,
    };
    if (
      bucket.previousTimestamp != null &&
      row.timestamp - bucket.previousTimestamp !== HOUR_MS
    ) {
      bucket.invalid = true;
      invalidIntervals += 1;
    }
    bucket.previousTimestamp = row.timestamp;
    bucket.endTimestamp = row.timestamp;
    const value = row.mean ?? row.state;
    if (value == null) {
      bucket.invalid = true;
      invalidIntervals += 1;
    } else {
      bucket.samples += 1;
      bucket.valueTotal += value;
      const low = row.minimum ?? value;
      const high = row.maximum ?? value;
      bucket.minimum = bucket.minimum == null ? low : Math.min(bucket.minimum, low);
      bucket.maximum = bucket.maximum == null ? high : Math.max(bucket.maximum, high);
    }
    days.set(day, bucket);
  }

  let invalidDays = 0;
  const daily = [...days.values()]
    .filter((bucket) => {
      const complete =
        !bucket.invalid &&
        bucket.samples >= 23 &&
        bucket.samples <= 25 &&
        isLocalMidnight(bucket.startTimestamp, clock) &&
        isLocalMidnight(bucket.endTimestamp, clock);
      if (!complete) invalidDays += 1;
      return complete;
    })
    .map((bucket) => ({
      day: bucket.day,
      value: round(bucket.valueTotal / bucket.samples),
      minimum: bucket.minimum == null ? null : round(bucket.minimum),
      maximum: bucket.maximum == null ? null : round(bucket.maximum),
      sampleCount: bucket.samples,
    }))
    .sort((left, right) => left.day.localeCompare(right.day));

  return { daily, invalidIntervals, invalidDays };
}

function sourceForMetadata({
  db,
  metadata,
  registry,
  stateEntityIds,
  timezone,
}) {
  const entityId = metadata.statistic_id;
  const entity = registry.entityRecords.get(entityId);
  const device = entity?.device_id
    ? registry.deviceRecords.get(entity.device_id)
    : null;
  const deviceLabel = firstText(device?.name_by_user, device?.name);
  const areaId = entity?.area_id ?? device?.area_id;
  const areaLabel = areaId ? registry.areaNames.get(areaId) ?? null : null;
  const rawLabel = firstText(entity?.name, entity?.original_name, metadata.name);
  const group = classifySource({
    entityId,
    label: rawLabel,
    deviceLabel,
    unit: metadata.unit_of_measurement ?? null,
    unitClass: metadata.unit_class ?? null,
  });
  const rows = rowsForStatistic(db, metadata.id);
  if (!rows.length) return null;

  const isWater = group.id === 'water';
  const aggregation = metadata.has_sum ? 'daily_total' : 'daily_average';
  const normalized = metadata.has_sum
    ? normalizeDailyTotal(rows, timezone, isWater)
    : normalizeDailyAverage(rows, timezone);
  const warningCount = normalized.invalidIntervals + normalized.invalidDays;
  // A recorder snapshot almost always begins and ends partway through a
  // calendar day. Those edge fragments are excluded, not treated as a reason
  // to hide every complete interval that follows. A source needs review only
  // when no safe complete day survives at all.
  const quality = normalized.daily.length ? 'available' : 'needs_review';
  const qualityDetail =
    normalized.daily.length
      ? warningCount
        ? `${warningCount} incomplete or discontinuous recorder intervals were excluded; shown values are the validated subset.`
        : null
      : 'No complete, continuous daily interval was safe to publish from this historical source.';

  return {
    entityId,
    label: safeDisplayLabel({
      entityId,
      label: rawLabel,
      groupId: group.id,
    }),
    deviceLabel,
    areaLabel,
    groupId: group.id,
    groupLabel: group.label,
    unit: metadata.unit_of_measurement ?? null,
    unitClass: metadata.unit_class ?? null,
    aggregation,
    // `statistics_meta` retains historical sources after their live state has
    // been retired. The recorder's state metadata is the reliable distinction
    // here; an entity-registry row alone can outlive a current state.
    isArchived: !stateEntityIds.has(entityId),
    quality,
    qualityDetail,
    firstObservedAt: new Date(rows[0].timestamp).toISOString(),
    dataThrough: new Date(rows.at(-1).timestamp).toISOString(),
    daily: normalized.daily,
  };
}

async function importChunk(endpoint, sources) {
  const response = await fetch(`${endpoint}/api/local/sensor-history/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sources }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Oriel rejected a sensor import (${response.status}): ${detail}`);
  }
}

async function main() {
  const arguments_ = parseArguments(process.argv.slice(2));
  if (!arguments_) return;

  const registry = loadRegistry(arguments_);
  const db = new DatabaseSync(arguments_.db, { readOnly: true });
  try {
    const stateEntityIds = currentStateEntityIds(db);
    const sources = metadataRows(db)
      .map((metadata) =>
        sourceForMetadata({
          db,
          metadata,
          registry,
          stateEntityIds,
          timezone: arguments_.timezone,
        }),
      )
      .filter(Boolean);
    if (!sources.length) throw new Error('No Home Assistant statistics were found.');

    for (let index = 0; index < sources.length; index += SOURCES_PER_REQUEST) {
      await importChunk(arguments_.endpoint, sources.slice(index, index + SOURCES_PER_REQUEST));
    }

    const groups = new Map();
    for (const source of sources) {
      groups.set(source.groupLabel, (groups.get(source.groupLabel) ?? 0) + 1);
    }
    console.log(
      `Imported ${sources.length} historical sensor sources across ${groups.size} Oriel system groups.`,
    );
  } finally {
    db.close();
  }
}

void main().catch((error) => {
  console.error(
    error instanceof Error ? `Import failed: ${error.message}` : 'Import failed.',
  );
  process.exitCode = 1;
});
