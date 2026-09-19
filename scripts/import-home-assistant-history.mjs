#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const HOUR_MS = 60 * 60 * 1000;
const EPSILON = 0.001;

function usage(message) {
  if (message) console.error(`Error: ${message}\n`);
  console.error(
    'Usage: node scripts/import-home-assistant-history.mjs --db <recorder.db> --manifest <private-manifest.json> --endpoint http://127.0.0.1:3001 [--energy <energy.json>]',
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

  const db = values.get('db');
  const manifest = values.get('manifest');
  const endpoint = values.get('endpoint');
  if (!db || !manifest || !endpoint) {
    usage('The --db, --manifest, and --endpoint arguments are required.');
    return null;
  }
  return { db, manifest, endpoint: endpoint.replace(/\/$/, ''), energy: values.get('energy') };
}

function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return value;
}

function string(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value.trim();
}

function dateTime(value, label) {
  const text = string(value, label);
  const milliseconds = Date.parse(text);
  if (Number.isNaN(milliseconds)) throw new Error(`${label} must be an ISO timestamp.`);
  return milliseconds;
}

function decimal(value) {
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

function parseManifest(raw) {
  const manifest = object(raw, 'Manifest');
  const timezone = string(manifest.timezone, 'Manifest time zone');
  if (!Array.isArray(manifest.sources) || !manifest.sources.length) {
    throw new Error('Manifest sources are required.');
  }

  const seenUtilities = new Set();
  const sources = manifest.sources.map((candidate) => {
    const source = object(candidate, 'Source');
    const utility = string(source.utility, 'Source utility');
    if (utility !== 'electricity' && utility !== 'water') {
      throw new Error('Source utility must be electricity or water.');
    }
    if (seenUtilities.has(utility)) {
      throw new Error(`Only one ${utility} source can be imported at a time.`);
    }
    seenUtilities.add(utility);

    const componentEntityIds =
      source.tariffComponentEntityIds == null
        ? []
        : Array.isArray(source.tariffComponentEntityIds)
          ? source.tariffComponentEntityIds.map((id) =>
              string(id, 'Tariff component entity ID'),
            )
          : (() => {
              throw new Error('Tariff component entity IDs must be an array.');
            })();

    return {
      utility,
      entityId: string(source.entityId, 'Source entity ID'),
      label: string(source.label, 'Source label'),
      scope: string(source.scope, 'Source scope'),
      unit: string(source.unit, 'Source unit'),
      qualityDetail: string(source.qualityDetail, 'Source quality detail'),
      excludeThrough:
        source.excludeThrough == null
          ? null
          : dateTime(source.excludeThrough, 'Source exclusion cutoff'),
      tariffComponentEntityIds: componentEntityIds,
    };
  });

  return { timezone, sources };
}

function configuredRatePencePerUnit(energy, componentEntityIds) {
  if (!componentEntityIds.length) return null;
  const sources = energy?.data?.energy_sources;
  if (!Array.isArray(sources)) {
    throw new Error('The Energy dashboard configuration is unavailable.');
  }

  const rates = componentEntityIds.map((entityId) => {
    const match = sources.find(
      (source) => source?.stat_energy_from === entityId,
    );
    const rate = decimal(match?.number_energy_price);
    if (rate == null || rate < 0) {
      throw new Error(`No configured tariff was found for ${entityId}.`);
    }
    return rate;
  });

  if (rates.some((rate) => Math.abs(rate - rates[0]) > EPSILON)) {
    throw new Error('Component tariffs disagree; a cost estimate would be unsafe.');
  }
  // Home Assistant stores this configured grid price in currency units/kWh.
  return round(rates[0] * 100, 4);
}

function rowsForStatistic(db, entityId) {
  const rows = db
    .prepare(
      `SELECT s.start_ts AS timestamp, s.state AS state, s.sum AS sum
       FROM statistics s
       JOIN statistics_meta m ON m.id = s.metadata_id
       WHERE m.statistic_id = ?
       ORDER BY s.start_ts ASC`,
    )
    .all(entityId);

  if (rows.length < 25) {
    throw new Error(`${entityId} has too little long-term history to import.`);
  }

  return rows.map((row) => ({
    timestamp: Number(row.timestamp) * 1000,
    state: decimal(row.state),
    sum: decimal(row.sum),
  }));
}

/**
 * An interval is accepted only when Home Assistant's raw state and recorder
 * sum agree. That rejects reset/correction artefacts instead of turning them
 * into apparent consumption. A full local day needs 23–25 contiguous hourly
 * intervals so the DST change is handled without special cases.
 */
function normalizeDaily(rows, timezone, excludeThrough) {
  const formatter = dateFormatter(timezone);
  const clock = timeFormatter(timezone);
  const days = new Map();
  const invalidEnds = [];

  for (let index = 1; index < rows.length; index += 1) {
    const previous = rows[index - 1];
    const current = rows[index];
    // Assign the interval to the local day in which it ends. Long-term
    // statistics are stored at UTC hour boundaries, so grouping by the
    // previous UTC timestamp would shift British-summer-time dates by an hour.
    const day = dayFor(current.timestamp - 1, formatter);
    const bucket = days.get(day) ?? {
      day,
      startTimestamp: previous.timestamp,
      endTimestamp: current.timestamp,
      intervals: 0,
      invalid: false,
      consumption: 0,
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
      sumDelta != null &&
      stateDelta >= -EPSILON &&
      sumDelta >= -EPSILON &&
      Math.abs(sumDelta - stateDelta) <= EPSILON;

    if (!valid) {
      bucket.invalid = true;
      invalidEnds.push(current.timestamp);
    } else {
      bucket.intervals += 1;
      bucket.consumption += sumDelta;
    }
    days.set(day, bucket);
  }

  const cutoffDay =
    excludeThrough == null ? null : dayFor(excludeThrough, formatter);
  const lastUnexpectedAnomaly = invalidEnds.find(
    (timestamp) => excludeThrough == null || timestamp > excludeThrough,
  );
  if (lastUnexpectedAnomaly != null) {
    throw new Error(
      'The source has a discontinuity after its approved exclusion cutoff.',
    );
  }

  const daily = [...days.values()]
    .filter(
      (bucket) =>
        !bucket.invalid &&
        bucket.intervals >= 23 &&
        bucket.intervals <= 25 &&
        isLocalMidnight(bucket.startTimestamp, clock) &&
        isLocalMidnight(bucket.endTimestamp, clock) &&
        (!cutoffDay || bucket.day > cutoffDay),
    )
    .map((bucket) => ({
      day: bucket.day,
      consumption: round(bucket.consumption),
      firstObservedAt: new Date(bucket.startTimestamp).toISOString(),
    }))
    .sort((left, right) => left.day.localeCompare(right.day));

  if (!daily.length) throw new Error('No complete, validated daily intervals remain.');
  return daily;
}

function payloadForSource({ db, source, timezone, energy }) {
  const rows = rowsForStatistic(db, source.entityId);
  const daily = normalizeDaily(rows, timezone, source.excludeThrough);
  const ratePencePerUnit = configuredRatePencePerUnit(
    energy,
    source.tariffComponentEntityIds,
  );

  return {
    utility: source.utility,
    source: {
      label: source.label,
      scope: source.scope,
      entityId: source.entityId,
      unit: source.unit,
      timezone,
      firstObservedAt: daily[0].firstObservedAt,
      dataThrough: new Date(rows.at(-1).timestamp).toISOString(),
    },
    quality: 'available',
    qualityDetail: source.qualityDetail,
    ratePencePerUnit,
    daily: daily.map(({ day, consumption }) => ({ day, consumption })),
  };
}

async function importPayload(endpoint, payload) {
  const response = await fetch(`${endpoint}/api/local/utility-history/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Oriel rejected the ${payload.utility} import (${response.status}): ${detail}`);
  }
}

async function main() {
  const arguments_ = parseArguments(process.argv.slice(2));
  if (!arguments_) return;

  const manifest = parseManifest(
    JSON.parse(readFileSync(arguments_.manifest, 'utf8')),
  );
  const energy = arguments_.energy
    ? JSON.parse(readFileSync(arguments_.energy, 'utf8'))
    : null;
  const db = new DatabaseSync(arguments_.db, { readOnly: true });

  try {
    const payloads = manifest.sources.map((source) =>
      payloadForSource({ db, source, timezone: manifest.timezone, energy }),
    );
    for (const payload of payloads) {
      await importPayload(arguments_.endpoint, payload);
    }
    console.log(
      `Imported ${payloads.map((payload) => `${payload.utility}: ${payload.daily.length} validated daily points`).join('; ')}.`,
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
