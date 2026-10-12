#!/usr/bin/env node

/*
 * Creates a LOCAL-ONLY Oriel-card fixture from the Aldworth Recorder copy.
 * The generated module is ignored by Git so raw history can never be pushed.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const root = resolve(import.meta.dirname, '..');
const dbPath = process.argv[2] || resolve(root, 'data/imports/aldworth/analysis/data/home-assistant_v2.db');
const manifestPath = process.argv[3] || resolve(root, 'data/imports/aldworth/analysis/oriel-utility-history-manifest.json');
const outputPath = resolve(root, 'public/oriel-private/aldworth-history.js');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const HOUR_MS = 60 * 60 * 1000;
const EPSILON = 0.001;
const PLAYBACK_WEEKS = 6;
// `sources` stays compatible with the production history-import manifest:
// one curated primary source per utility. Extra source-level history belongs
// only to this ignored, local playback fixture and must never be imported or
// published with the production aggregate.
const configuredSources = [
  ...(Array.isArray(manifest.sources) ? manifest.sources.map((source) => ({ ...source, isPlaybackSource: false })) : []),
  ...(Array.isArray(manifest.playbackSources) ? manifest.playbackSources.map((source) => ({ ...source, isPlaybackSource: true })) : []),
];
const sourcesToPlay = [...new Map(configuredSources
  .filter((source) => source && typeof source.entityId === 'string')
  .map((source) => [source.entityId, source])).values()];
const db = new DatabaseSync(dbPath, { readOnly: true });

const finite = (value) => typeof value === 'number' && Number.isFinite(value);
const round = (value) => Math.round((value + Number.EPSILON) * 1000) / 1000;

function formatter(timezone, options) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, ...options });
}

function part(parts, type) {
  return parts.find((entry) => entry.type === type)?.value || null;
}

function dayFor(timestamp, dayFormatter) {
  const parts = dayFormatter.formatToParts(new Date(timestamp));
  const year = part(parts, 'year');
  const month = part(parts, 'month');
  const day = part(parts, 'day');
  if (!year || !month || !day) throw new Error('Could not derive a local calendar day.');
  return `${year}-${month}-${day}`;
}

function isLocalMidnight(timestamp, clockFormatter) {
  const parts = clockFormatter.formatToParts(new Date(timestamp));
  return part(parts, 'hour') === '00' && part(parts, 'minute') === '00';
}

function mondayFor(day) {
  const result = new Date(`${day}T00:00:00.000Z`);
  result.setUTCDate(result.getUTCDate() - ((result.getUTCDay() + 6) % 7));
  return result.toISOString().slice(0, 10);
}

function weekStartsFor(daily) {
  const latest = daily.at(-1)?.day;
  if (!latest) throw new Error('No complete daily record is available for the fixture.');
  const latestMonday = new Date(`${mondayFor(latest)}T00:00:00.000Z`);
  return Array.from({ length: PLAYBACK_WEEKS }, (_, index) => {
    const date = new Date(latestMonday);
    date.setUTCDate(date.getUTCDate() - index * 7);
    return date.toISOString().slice(0, 10);
  });
}

function weeklySeries(daily, weekStarts) {
  const byDay = new Map(daily.map((entry) => [entry.day, entry.value]));
  return weekStarts.map((weekStart) => {
    let total = 0;
    let days = 0;
    for (let offset = 0; offset < 7; offset += 1) {
      const date = new Date(`${weekStart}T00:00:00.000Z`);
      date.setUTCDate(date.getUTCDate() + offset);
      const value = byDay.get(date.toISOString().slice(0, 10));
      if (finite(value)) {
        total += value;
        days += 1;
      }
    }
    return { value: days ? round(total) : null, days: days || null };
  });
}

/**
 * The fixture uses the same conservative interval checks as the data import:
 * every interval needs its state and Recorder sum to agree. A playback source
 * can keep individually valid days before an approved
 * discontinuity, but never crosses it, and every partial week exposes its
 * recorded-day count to the card.
 */
function normalizedDaily(rows, source, timezone) {
  const dayFormatter = formatter(timezone, { year: 'numeric', month: '2-digit', day: '2-digit' });
  const clockFormatter = formatter(timezone, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const days = new Map();
  const invalidEnds = [];
  for (let index = 1; index < rows.length; index += 1) {
    const previous = rows[index - 1];
    const current = rows[index];
    const day = dayFor(current.timestamp - 1, dayFormatter);
    const bucket = days.get(day) || {
      day,
      startTimestamp: previous.timestamp,
      endTimestamp: current.timestamp,
      intervals: 0,
      invalid: false,
      value: 0,
    };
    bucket.endTimestamp = current.timestamp;
    const stateDelta = current.state - previous.state;
    const sumDelta = current.sum - previous.sum;
    const stateValid = current.timestamp - previous.timestamp === HOUR_MS
      && finite(stateDelta) && stateDelta >= -EPSILON;
    const sumValid = finite(sumDelta) && sumDelta >= -EPSILON
      && Math.abs(sumDelta - stateDelta) <= EPSILON;
    const valid = stateValid && sumValid;
    if (!valid) {
      bucket.invalid = true;
      invalidEnds.push(current.timestamp);
    } else {
      bucket.intervals += 1;
      bucket.value += stateDelta;
    }
    days.set(day, bucket);
  }

  const cutoff = source.excludeThrough == null ? null : Date.parse(source.excludeThrough);
  if (source.excludeThrough != null && !Number.isFinite(cutoff)) {
    throw new Error(`Invalid exclusion cutoff for ${source.entityId}`);
  }
  const unexpected = invalidEnds.find((timestamp) => cutoff == null || timestamp > cutoff);
  if (unexpected != null) {
    throw new Error(`${source.entityId} has a discontinuity after its approved exclusion cutoff.`);
  }
  const cutoffDay = cutoff == null ? null : dayFor(cutoff, dayFormatter);
  return [...days.values()]
    .filter((bucket) => !bucket.invalid
      && bucket.intervals >= 23 && bucket.intervals <= 25
      && isLocalMidnight(bucket.startTimestamp, clockFormatter)
      && isLocalMidnight(bucket.endTimestamp, clockFormatter)
      // Primary utility series retain their conservative import boundary.
      // Breakdown sources may retain separate, individually validated days
      // before that boundary, with their coverage shown in the card.
      && (source.isPlaybackSource || !cutoffDay || bucket.day > cutoffDay))
    .map((bucket) => ({ day: bucket.day, value: round(bucket.value) }))
    .sort((left, right) => left.day.localeCompare(right.day));
}

try {
  const timezone = typeof manifest.timezone === 'string' && manifest.timezone ? manifest.timezone : 'Europe/London';
  const sources = {};
  const dailyBySource = new Map();
  let anchor = 0;
  for (const source of sourcesToPlay) {
    const last = db.prepare(`SELECT MAX(start_ts) AS value FROM statistics s JOIN statistics_meta m ON m.id = s.metadata_id WHERE m.statistic_id = ?`).get(source.entityId)?.value;
    if (!Number.isFinite(last)) throw new Error(`No statistics for ${source.entityId}`);
    anchor = Math.max(anchor, Number(last) * 1000);
  }
  for (const source of sourcesToPlay) {
    const rows = db.prepare(
      `SELECT s.start_ts AS timestamp, s.state AS state, s.sum AS sum
       FROM statistics s JOIN statistics_meta m ON m.id = s.metadata_id
       WHERE m.statistic_id = ? AND s.start_ts >= ? AND s.state IS NOT NULL
       ORDER BY s.start_ts`,
    ).all(source.entityId, 0).map((row) => ({
      timestamp: Number(row.timestamp) * 1000,
      state: Number(row.state),
      sum: Number(row.sum),
    }));
    if (!rows.length) throw new Error(`No usable rows for ${source.entityId}`);
    const daily = normalizedDaily(rows, source, timezone);
    if (!daily.length) throw new Error(`No complete validated days for ${source.entityId}`);
    dailyBySource.set(source.entityId, daily);
    sources[source.entityId] = {
      state: String(rows.at(-1).state),
      label: source.label,
      unit: source.unit,
      deviceClass: source.utility === 'electricity' ? 'energy' : 'volume',
    };
  }
  const archive = {};
  for (const source of sourcesToPlay.filter((candidate) => !candidate.isPlaybackSource)) {
    const daily = dailyBySource.get(source.entityId);
    const weekStarts = weekStartsFor(daily);
    const weekly = weeklySeries(daily, weekStarts);
    while (weekly.length && weekly.at(-1).value === null) {
      weekly.pop();
      weekStarts.pop();
    }
    archive[source.utility] = {
      weekStarts,
      values: weekly.map((entry) => entry.value),
      recordedDays: weekly.map((entry) => entry.days),
    };
  }
  const breakdowns = Object.fromEntries(sourcesToPlay
    .filter((source) => source.isPlaybackSource)
    .map((source) => {
      const parent = archive[source.utility];
      const weekly = parent ? weeklySeries(dailyBySource.get(source.entityId), parent.weekStarts) : [];
      return [source.entityId, {
        values: weekly.map((entry) => entry.value),
        recordedDays: weekly.map((entry) => entry.days),
      }];
    }));
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `// Generated locally from the private Aldworth Recorder archive. DO NOT COMMIT.\nwindow.__orielAldworthHistoryFixture = ${JSON.stringify({ anchor: new Date(anchor).toISOString(), sources, archive, breakdowns })};\n`, 'utf8');
  console.log(`Created ${outputPath} with ${Object.keys(sources).length} approved source series through ${new Date(anchor).toISOString()}.`);
} finally {
  db.close();
}
