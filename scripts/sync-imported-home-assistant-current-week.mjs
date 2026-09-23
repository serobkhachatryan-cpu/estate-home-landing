#!/usr/bin/env node

import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import process from 'node:process';

const HISTORY_BATCH_SIZE = 10;
const PUBLISH_BATCH_SIZE = 100;
const EPSILON = 0.001;

function usage() {
  return [
    'Usage: npm run sync:imported-home-assistant-current-week -- \\',
    '  --db <home-assistant_v2.db> --home-assistant-url <url> \\',
    '  --oriel-url <url> [--timezone Europe/London]',
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
  const required = ['db', 'home-assistant-url', 'oriel-url'];
  if (required.some((name) => !values.get(name))) throw new Error(usage());
  return {
    dbPath: path.resolve(process.cwd(), values.get('db')),
    homeAssistantUrl: rootUrl(
      values.get('home-assistant-url'),
      'Home Assistant URL',
      true,
    ),
    orielUrl: rootUrl(values.get('oriel-url'), 'Oriel URL', false),
    timezone: values.get('timezone') ?? 'Europe/London',
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
  if (!isRoot) {
    throw new Error(`${label} must be a root URL without credentials.`);
  }
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

function round(value, digits = 3) {
  const scale = 10 ** digits;
  return Math.round((value + Number.EPSILON) * scale) / scale;
}

function localDate(timestamp, timezone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(timestamp));
  const read = (type) => parts.find((part) => part.type === type)?.value;
  const year = read('year');
  const month = read('month');
  const day = read('day');
  if (!year || !month || !day)
    throw new Error('Could not derive the local date.');
  return `${year}-${month}-${day}`;
}

function mondayFor(day) {
  const date = new Date(`${day}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime()))
    throw new Error('Could not derive the week.');
  const weekday = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - weekday + 1);
  return date.toISOString().slice(0, 10);
}

function dayCountFrom(start, now, timezone) {
  const today = localDate(now.getTime(), timezone);
  const difference =
    (Date.parse(`${today}T12:00:00.000Z`) -
      Date.parse(`${start}T12:00:00.000Z`)) /
    86_400_000;
  return Math.max(1, Math.min(7, Math.floor(difference) + 1));
}

function timezoneOffsetMilliseconds(day, timezone) {
  const atNoon = new Date(`${day}T12:00:00.000Z`);
  const name = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'longOffset',
  })
    .formatToParts(atNoon)
    .find((part) => part.type === 'timeZoneName')?.value;
  if (!name || name === 'GMT') return 0;
  const match = name.match(/^GMT([+-])(\d{2}):(\d{2})$/);
  if (!match) throw new Error('Could not derive the local UTC offset.');
  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return (match[1] === '+' ? 1 : -1) * minutes * 60_000;
}

function localMidnight(day, timezone) {
  const nominal = Date.parse(`${day}T00:00:00.000Z`);
  return new Date(nominal - timezoneOffsetMilliseconds(day, timezone));
}

function importedStatistics(db) {
  return db
    .prepare(
      `SELECT statistic_id, has_sum
       FROM statistics_meta
       WHERE statistic_id LIKE 'sensor.%'
       ORDER BY statistic_id`,
    )
    .all()
    .map((row) => ({
      entityId: row.statistic_id,
      aggregation: Number(row.has_sum) ? 'daily_total' : 'daily_average',
    }));
}

function numericState(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}

function eventTime(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const item = value;
  const timestamp =
    typeof item.last_updated === 'string'
      ? item.last_updated
      : typeof item.last_changed === 'string'
        ? item.last_changed
        : null;
  if (!timestamp) return null;
  const milliseconds = Date.parse(timestamp);
  const state = numericState(item.state);
  return Number.isFinite(milliseconds) && state != null
    ? { milliseconds, state }
    : null;
}

function asSeries(payload, entityIds) {
  if (!Array.isArray(payload)) {
    throw new Error('Home Assistant returned invalid history.');
  }
  const identified = new Map(
    payload
      .filter(Array.isArray)
      .map((series) => {
        const entityId = series.find(
          (item) =>
            item &&
            typeof item === 'object' &&
            !Array.isArray(item) &&
            typeof item.entity_id === 'string',
        )?.entity_id;
        return typeof entityId === 'string' ? [entityId, series] : null;
      })
      .filter(Boolean),
  );
  return entityIds.map((entityId, index) => {
    const series =
      identified.get(entityId) ??
      (payload.length === entityIds.length ? payload[index] : []);
    return { entityId, series: Array.isArray(series) ? series : [] };
  });
}

function currentTotal(series) {
  const events = series.map(eventTime);
  if (!events.length || events.some((event) => !event)) return null;
  const readings = events;
  let previous = readings[0].state;
  for (const reading of readings.slice(1)) {
    if (reading.state + EPSILON < previous) return null;
    previous = reading.state;
  }
  return {
    value: round(previous - readings[0].state),
    minimum: null,
    maximum: null,
  };
}

function currentAverage(series, start, end) {
  const events = series.map(eventTime);
  if (!events.length || events.some((event) => !event)) return null;
  const readings = events;
  let value = readings[0].state;
  let cursor = start;
  let weightedTotal = 0;
  let covered = 0;
  let minimum = value;
  let maximum = value;

  for (const reading of readings.slice(1)) {
    const next = Math.min(Math.max(reading.milliseconds, start), end);
    if (next > cursor) {
      weightedTotal += value * (next - cursor);
      covered += next - cursor;
      cursor = next;
    }
    value = reading.state;
    minimum = Math.min(minimum, value);
    maximum = Math.max(maximum, value);
  }
  if (end > cursor) {
    weightedTotal += value * (end - cursor);
    covered += end - cursor;
  }
  if (!covered) return null;
  return {
    value: round(weightedTotal / covered),
    minimum: round(minimum),
    maximum: round(maximum),
  };
}

async function homeAssistantHistory({ url, token, start, end, entityIds }) {
  const requestUrl = new URL(
    `/api/history/period/${encodeURIComponent(start.toISOString())}`,
    url,
  );
  requestUrl.searchParams.set('filter_entity_id', entityIds.join(','));
  requestUrl.searchParams.set('end_time', end.toISOString());
  requestUrl.searchParams.set('minimal_response', '');
  requestUrl.searchParams.set('no_attributes', '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);
  try {
    const response = await fetch(requestUrl, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      redirect: 'error',
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Home Assistant history returned ${response.status}.`);
    }
    return asSeries(await response.json(), entityIds);
  } finally {
    clearTimeout(timeout);
  }
}

async function publishWeeks(orielUrl, bridgeToken, investorShare, weeks) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
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
        body: JSON.stringify({ mode: 'current_week', investorShare, weeks }),
        redirect: 'error',
        signal: controller.signal,
      },
    );
    if (!response.ok) {
      throw new Error(
        `Oriel rejected the current-week summary (${response.status}).`,
      );
    }
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const homeAssistantToken = requiredEnvironment(
    'ORIEL_HOME_ASSISTANT_TOKEN',
    /^\S+$/,
  );
  const bridgeToken = requiredEnvironment(
    'ORIEL_LIVE_BRIDGE_TOKEN',
    /^[A-Za-z0-9_-]{32,128}$/,
  );
  const investorShare = requiredEnvironment(
    'ORIEL_INVESTOR_SHARE_TOKEN',
    /^[A-Za-z0-9_-]{32,128}$/,
  );
  const db = new DatabaseSync(options.dbPath, { readOnly: true });
  const sources = importedStatistics(db);
  db.close();
  if (!sources.length)
    throw new Error('No imported Home Assistant statistics were found.');

  const observedAt = new Date();
  const weekStart = mondayFor(
    localDate(observedAt.getTime(), options.timezone),
  );
  const start = localMidnight(weekStart, options.timezone);
  const dayCount = dayCountFrom(weekStart, observedAt, options.timezone);
  const summaries = [];

  for (let index = 0; index < sources.length; index += HISTORY_BATCH_SIZE) {
    const batch = sources.slice(index, index + HISTORY_BATCH_SIZE);
    const series = await homeAssistantHistory({
      url: options.homeAssistantUrl,
      token: homeAssistantToken,
      start,
      end: observedAt,
      entityIds: batch.map((source) => source.entityId),
    });
    for (const { entityId, series: states } of series) {
      const source = batch.find((candidate) => candidate.entityId === entityId);
      if (!source) continue;
      const summary =
        source.aggregation === 'daily_total'
          ? currentTotal(states)
          : currentAverage(states, start.getTime(), observedAt.getTime());
      if (!summary) continue;
      summaries.push({
        entityId,
        weekStart,
        ...summary,
        dayCount,
        observedAt: observedAt.toISOString(),
      });
    }
  }

  if (!summaries.length) {
    throw new Error('No validated current-week summaries were available.');
  }
  for (let index = 0; index < summaries.length; index += PUBLISH_BATCH_SIZE) {
    await publishWeeks(
      options.orielUrl,
      bridgeToken,
      investorShare,
      summaries.slice(index, index + PUBLISH_BATCH_SIZE),
    );
  }
  console.log(
    `Published ${summaries.length} normalized current-week summaries for ${weekStart}.`,
  );
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : 'Current-week sync failed.',
  );
  process.exitCode = 1;
});
