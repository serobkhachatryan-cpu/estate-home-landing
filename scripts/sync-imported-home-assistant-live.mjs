#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { DatabaseSync } from 'node:sqlite';

const BATCH_SIZE = 100;

function usage() {
  return [
    'Usage: npm run sync:imported-home-assistant-live -- \\',
    '  --db <home-assistant_v2.db> --entity-registry <core.entity_registry> \\',
    '  --home-assistant-url <url> --oriel-url <url>',
    '',
    'Required environment variables (never commit or pass on the command line):',
    '  ORIEL_HOME_ASSISTANT_TOKEN',
    '  ORIEL_LIVE_BRIDGE_TOKEN',
    '  ORIEL_INVESTOR_SHARE_TOKEN',
  ].join('\n');
}

function parseArguments(args) {
  const values = new Map();
  for (let index = 0; index < args.length; index += 2) {
    const name = args[index];
    const value = args[index + 1];
    if (!name?.startsWith('--') || !value || value.startsWith('--')) {
      throw new Error(usage());
    }
    values.set(name.slice(2), value);
  }
  const required = ['db', 'entity-registry', 'home-assistant-url', 'oriel-url'];
  if (required.some((name) => !values.get(name))) throw new Error(usage());
  return {
    dbPath: path.resolve(process.cwd(), values.get('db')),
    entityRegistryPath: path.resolve(
      process.cwd(),
      values.get('entity-registry'),
    ),
    homeAssistantUrl: rootUrl(
      values.get('home-assistant-url'),
      'Home Assistant URL',
      true,
    ),
    orielUrl: rootUrl(values.get('oriel-url'), 'Oriel URL', false),
  };
}

function rootUrl(value, label, allowTailnetHttp) {
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error(`${label} is invalid.`);
  }
  const isRoot =
    !url.username &&
    !url.password &&
    !url.search &&
    !url.hash &&
    (url.pathname === '' || url.pathname === '/');
  if (!isRoot)
    throw new Error(`${label} must be a root URL without credentials.`);
  if (url.protocol === 'https:') return url.origin;
  if (
    allowTailnetHttp &&
    url.protocol === 'http:' &&
    (url.hostname.endsWith('.ts.net') ||
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1')
  ) {
    return url.origin;
  }
  throw new Error(`${label} must use HTTPS or an owner Tailnet URL.`);
}

function requiredEnvironment(name, pattern) {
  const value = process.env[name]?.trim();
  if (!value || value.length > 512 || !pattern.test(value)) {
    throw new Error(`${name} is not available in the process environment.`);
  }
  return value;
}

function text(value, maximum) {
  return typeof value === 'string' &&
    value.trim() &&
    value.trim().length <= maximum
    ? value.trim()
    : null;
}

function date(value) {
  const candidate = text(value, 64);
  if (!candidate || Number.isNaN(new Date(candidate).getTime())) return null;
  return new Date(candidate).toISOString();
}

function humanize(entityId) {
  return entityId
    .replace(/^sensor\./, '')
    .replaceAll(/[_-]+/g, ' ')
    .replaceAll(/\b\w/g, (character) => character.toUpperCase())
    .replaceAll(/\s+/g, ' ')
    .trim();
}

function groupFor({ entityId, label, unit, unitClass }) {
  const source = `${entityId} ${label ?? ''}`.toLowerCase();
  const has = (pattern) => pattern.test(source);
  if (has(/(?:fuel_tank|fuel tank|oil tank|diesel tank)/)) return 'fuel';
  if (has(/(?:printer|toner|drum|cartridge)/)) return 'care';
  if (
    has(
      /(?:nvr|camera|intercom|recording|timelapse|detection|disk.write|storage.used)/,
    ) ||
    /sensor\.(?:house_(?:basement|garage|loft|pool)_battery|lodge_battery)$/.test(
      entityId,
    )
  ) {
    return 'security';
  }
  if (entityId.startsWith('sensor.hp2564ae_pro_v2_0_9_')) return 'climate';
  if (has(/(?:signal strength|signal_strength)/)) return 'network';
  if (
    has(/(?:shelly|ups|battery_charge|tank_input_voltage)/) ||
    /sensor\.(?:lodge_load|office_load)$/.test(entityId)
  ) {
    return 'power';
  }
  if (
    has(
      /(?:starlink|network|cpu|memory|poe|switch|uplink|downlink|ping|signal|disk)/,
    )
  ) {
    return 'network';
  }
  if (
    has(
      /(?:weather|outdoor|indoor|dewpoint|wind|rain|solar|uv|humidity|temperature|pressure|illuminance|lux|feels.like|windchill)/,
    ) ||
    ['temperature', 'pressure', 'speed'].includes(unitClass ?? '') ||
    ['°C', 'hPa', 'lx'].includes(unit ?? '')
  ) {
    return 'climate';
  }
  if (
    has(/(?:water|flow)/) ||
    unitClass === 'volume_flow_rate' ||
    (unitClass === 'volume' && !has(/(?:fuel|oil|tank)/))
  ) {
    return 'water';
  }
  if (
    has(
      /(?:shelly|electric|power|energy|voltage|current|plug|ups|phase|garage input|house input|office input)/,
    ) ||
    [
      'power',
      'energy',
      'voltage',
      'electric_current',
      'apparent_power',
    ].includes(unitClass ?? '') ||
    ['W', 'kWh', 'V', 'A', 'VA', 'GBP'].includes(unit ?? '')
  ) {
    return 'power';
  }
  return 'sensors';
}

function importedMetadata(db) {
  return new Map(
    db
      .prepare(
        `SELECT statistic_id, unit_of_measurement, unit_class, name
         FROM statistics_meta
         WHERE statistic_id LIKE 'sensor.%'
         ORDER BY statistic_id`,
      )
      .all()
      .map((row) => [
        row.statistic_id,
        {
          unit: text(row.unit_of_measurement, 40),
          unitClass: text(row.unit_class, 80),
          name: text(row.name, 160),
        },
      ]),
  );
}

async function registryNames(file) {
  const parsed = JSON.parse(await readFile(file, 'utf8'));
  return new Map(
    (Array.isArray(parsed?.data?.entities) ? parsed.data.entities : [])
      .filter((entity) => typeof entity?.entity_id === 'string')
      .map((entity) => [entity.entity_id, text(entity.name, 160)]),
  );
}

async function homeAssistantStates(homeAssistantUrl, token) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(new URL('/api/states', homeAssistantUrl), {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      redirect: 'error',
      signal: controller.signal,
    });
    if (!response.ok)
      throw new Error(`Home Assistant returned ${response.status}.`);
    const payload = await response.json();
    if (!Array.isArray(payload))
      throw new Error('Home Assistant returned an invalid state list.');
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

function readingsFromStates(states, metadata, registry) {
  const readings = [];
  for (const item of states) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const entityId = text(item.entity_id, 255);
    const state = text(item.state, 160);
    const source = entityId ? metadata.get(entityId) : null;
    if (!entityId || !state || !source) continue;
    const attributes =
      item.attributes &&
      typeof item.attributes === 'object' &&
      !Array.isArray(item.attributes)
        ? item.attributes
        : {};
    const unit = text(attributes.unit_of_measurement, 40) ?? source.unit;
    const label =
      text(attributes.friendly_name, 160) ??
      registry.get(entityId) ??
      source.name ??
      humanize(entityId);
    const stateUpdatedAt = date(item.last_updated) ?? date(item.last_changed);
    if (!stateUpdatedAt) continue;
    readings.push({
      entityId,
      groupId: groupFor({ entityId, label, unit, unitClass: source.unitClass }),
      label,
      state,
      unit,
      stateUpdatedAt,
    });
  }
  return readings.sort((left, right) =>
    left.entityId.localeCompare(right.entityId),
  );
}

async function postBatch(orielUrl, bridgeToken, investorShare, readings) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(
      new URL('/api/internal/live-sensor-snapshot', orielUrl),
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${bridgeToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode: 'merge', investorShare, readings }),
        redirect: 'error',
        signal: controller.signal,
      },
    );
    if (!response.ok)
      throw new Error(`Oriel rejected a live snapshot (${response.status}).`);
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const [homeAssistantToken, bridgeToken, investorShare, registry] =
    await Promise.all([
      Promise.resolve(
        requiredEnvironment('ORIEL_HOME_ASSISTANT_TOKEN', /^\S+$/),
      ),
      Promise.resolve(
        requiredEnvironment(
          'ORIEL_LIVE_BRIDGE_TOKEN',
          /^[A-Za-z0-9_-]{32,128}$/,
        ),
      ),
      Promise.resolve(
        requiredEnvironment(
          'ORIEL_INVESTOR_SHARE_TOKEN',
          /^[A-Za-z0-9_-]{32,128}$/,
        ),
      ),
      registryNames(options.entityRegistryPath),
    ]);
  const db = new DatabaseSync(options.dbPath, { readOnly: true });
  const metadata = importedMetadata(db);
  db.close();
  const readings = readingsFromStates(
    await homeAssistantStates(options.homeAssistantUrl, homeAssistantToken),
    metadata,
    registry,
  );
  if (!readings.length)
    throw new Error(
      'No active Aldworth sensor state matched the imported inventory.',
    );
  for (let index = 0; index < readings.length; index += BATCH_SIZE) {
    await postBatch(
      options.orielUrl,
      bridgeToken,
      investorShare,
      readings.slice(index, index + BATCH_SIZE),
    );
  }
  console.log(
    `Published ${readings.length} current states from the imported sensor inventory.`,
  );
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : 'Live inventory sync failed.',
  );
  process.exitCode = 1;
});
