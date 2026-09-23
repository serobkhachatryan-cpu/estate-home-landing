#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const allowedGroups = new Set([
  'power',
  'water',
  'fuel',
  'climate',
  'security',
  'network',
  'care',
  'sensors',
]);

function usage() {
  return [
    'Usage: npm run sync:home-assistant-live -- --config <path>',
    '',
    'Required environment variables (never pass them on the command line):',
    '  ORIEL_HOME_ASSISTANT_TOKEN  Home Assistant long-lived access token',
    '  ORIEL_LIVE_BRIDGE_TOKEN     Oriel bridge secret',
  ].join('\n');
}

function parseArguments(args) {
  let configPath = null;
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value !== '--config' || configPath || !args[index + 1]) {
      throw new Error(usage());
    }
    configPath = args[index + 1];
    index += 1;
  }
  if (!configPath) throw new Error(usage());
  return path.resolve(process.cwd(), configPath);
}

function requiredEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value)
    throw new Error(`${name} is required in the process environment.`);
  if (value.length > 512 || /\s/.test(value)) {
    throw new Error(`${name} is invalid.`);
  }
  return value;
}

function rootUrl(value, label, allowTailnetHttp) {
  if (typeof value !== 'string') throw new Error(`${label} is required.`);
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
  const tailnetOrLoopback =
    url.hostname.endsWith('.ts.net') ||
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1';
  if (allowTailnetHttp && url.protocol === 'http:' && tailnetOrLoopback) {
    return url.origin;
  }
  throw new Error(
    `${label} must use HTTPS${allowTailnetHttp ? ' (or local/Tailnet HTTP)' : ''}.`,
  );
}

function ownerEName(value) {
  if (
    typeof value !== 'string' ||
    !/^[a-z0-9_:@.-]{1,120}$/i.test(value.trim())
  ) {
    throw new Error('ownerEName is invalid.');
  }
  return value.trim();
}

function sensor(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Each configured sensor is invalid.');
  }
  const item = value;
  if (
    typeof item.entityId !== 'string' ||
    !/^sensor\.[a-zA-Z0-9_]+$/.test(item.entityId.trim())
  ) {
    throw new Error('Each configured sensor must be a sensor.<entity_id>.');
  }
  if (typeof item.groupId !== 'string' || !allowedGroups.has(item.groupId)) {
    throw new Error(`Sensor ${item.entityId} has an invalid groupId.`);
  }
  return { entityId: item.entityId.trim(), groupId: item.groupId };
}

function parseConfiguration(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Bridge configuration must be a JSON object.');
  }
  const config = value;
  if (
    !Array.isArray(config.sensors) ||
    !config.sensors.length ||
    config.sensors.length > 40
  ) {
    throw new Error('Configuration must contain between 1 and 40 sensors.');
  }
  const sensors = config.sensors.map(sensor);
  if (new Set(sensors.map((item) => item.entityId)).size !== sensors.length) {
    throw new Error('Each configured sensor must appear once.');
  }
  return {
    homeAssistantUrl: rootUrl(
      config.homeAssistantUrl,
      'homeAssistantUrl',
      true,
    ),
    orielUrl: rootUrl(config.orielUrl, 'orielUrl', false),
    ownerEName: ownerEName(config.ownerEName),
    sensors,
  };
}

function text(value, maximum) {
  return typeof value === 'string' &&
    value.trim() &&
    value.trim().length <= maximum
    ? value.trim()
    : null;
}

function timestamp(value) {
  const candidate = text(value, 64);
  if (!candidate || Number.isNaN(new Date(candidate).getTime())) return null;
  return new Date(candidate).toISOString();
}

async function readHomeAssistantState(
  homeAssistantUrl,
  token,
  configuredSensor,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(
      new URL(
        `/api/states/${encodeURIComponent(configuredSensor.entityId)}`,
        homeAssistantUrl,
      ),
      {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        redirect: 'error',
        signal: controller.signal,
      },
    );
    if (!response.ok) {
      throw new Error(
        `${configuredSensor.entityId}: Home Assistant returned ${response.status}.`,
      );
    }
    const payload = await response.json();
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error(
        `${configuredSensor.entityId}: Home Assistant response is invalid.`,
      );
    }
    const state = payload;
    const entityId = text(state.entity_id, 255);
    const currentState = text(state.state, 160);
    const attributes =
      state.attributes &&
      typeof state.attributes === 'object' &&
      !Array.isArray(state.attributes)
        ? state.attributes
        : {};
    const label =
      text(attributes.friendly_name, 160) ?? configuredSensor.entityId;
    const updatedAt =
      timestamp(state.last_updated) ?? timestamp(state.last_changed);
    if (entityId !== configuredSensor.entityId || !currentState || !updatedAt) {
      throw new Error(
        `${configuredSensor.entityId}: Home Assistant state is incomplete.`,
      );
    }
    return {
      entityId,
      groupId: configuredSensor.groupId,
      label,
      state: currentState,
      unit: text(attributes.unit_of_measurement, 40),
      stateUpdatedAt: updatedAt,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const configPath = parseArguments(process.argv.slice(2));
  const [homeAssistantToken, bridgeToken, file] = await Promise.all([
    Promise.resolve(requiredEnvironment('ORIEL_HOME_ASSISTANT_TOKEN')),
    Promise.resolve(requiredEnvironment('ORIEL_LIVE_BRIDGE_TOKEN')),
    readFile(configPath, 'utf8'),
  ]);
  let rawConfig;
  try {
    rawConfig = JSON.parse(file);
  } catch {
    throw new Error('Bridge configuration is not valid JSON.');
  }
  const config = parseConfiguration(rawConfig);

  // This is intentionally the only Home Assistant request shape in the live
  // bridge. There are no /api/services, /api/events, POST or PUT calls here.
  const readings = await Promise.all(
    config.sensors.map((configuredSensor) =>
      readHomeAssistantState(
        config.homeAssistantUrl,
        homeAssistantToken,
        configuredSensor,
      ),
    ),
  );

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(
      new URL('/api/internal/live-sensor-snapshot', config.orielUrl),
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${bridgeToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ownerEName: config.ownerEName, readings }),
        redirect: 'error',
        signal: controller.signal,
      },
    );
    if (!response.ok) {
      throw new Error(
        `Oriel live bridge rejected the snapshot (${response.status}).`,
      );
    }
  } finally {
    clearTimeout(timeout);
  }

  // Deliberately omit readings and credentials from logs: a scheduler only
  // needs proof that the current-state snapshot was delivered.
  console.log(
    `Published ${readings.length} allowlisted Home Assistant states to Oriel.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Live bridge failed.');
  process.exitCode = 1;
});
