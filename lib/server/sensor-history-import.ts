import type { SensorHistoryImportSource } from '@/lib/server/sensor-history';

const MAX_SOURCES_PER_REQUEST = 24;
const MAX_DAILY_POINTS_PER_SOURCE = 400;

function stringField(value: unknown, label: string, maximum = 500) {
  if (typeof value !== 'string') throw new Error(`${label} is required.`);
  const result = value.trim();
  if (!result || result.length > maximum) {
    throw new Error(`${label} is invalid.`);
  }
  return result;
}

function nullableString(value: unknown, label: string, maximum = 500) {
  if (value == null) return null;
  return stringField(value, label, maximum);
}

function isoDate(value: unknown, label: string) {
  const result = stringField(value, label, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result)) {
    throw new Error(`${label} must use YYYY-MM-DD.`);
  }
  const date = new Date(`${result}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== result) {
    throw new Error(`${label} is invalid.`);
  }
  return result;
}

function isoTimestamp(value: unknown, label: string) {
  const result = stringField(value, label, 64);
  if (Number.isNaN(new Date(result).getTime())) {
    throw new Error(`${label} is invalid.`);
  }
  return result;
}

function finiteNumber(
  value: unknown,
  label: string,
  minimum: number,
  maximum: number,
) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} is invalid.`);
  }
  if (value < minimum || value > maximum) {
    throw new Error(`${label} is invalid.`);
  }
  return value;
}

function parseSource(value: unknown): SensorHistoryImportSource {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Sensor source is invalid.');
  }
  const source = value as Record<string, unknown>;
  const aggregation = source.aggregation;
  if (aggregation !== 'daily_total' && aggregation !== 'daily_average') {
    throw new Error('Sensor aggregation is invalid.');
  }
  const quality = source.quality;
  if (quality !== 'available' && quality !== 'needs_review') {
    throw new Error('Sensor quality is invalid.');
  }
  if (
    !Array.isArray(source.daily) ||
    source.daily.length > MAX_DAILY_POINTS_PER_SOURCE
  ) {
    throw new Error('Sensor daily readings are invalid.');
  }

  const seenDays = new Set<string>();
  const daily = source.daily.map((candidate) => {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
      throw new Error('Sensor daily readings are invalid.');
    }
    const point = candidate as Record<string, unknown>;
    const day = isoDate(point.day, 'Sensor day');
    if (seenDays.has(day)) throw new Error('Sensor days must be unique.');
    seenDays.add(day);
    const minimum =
      point.minimum == null
        ? null
        : finiteNumber(point.minimum, 'Sensor minimum', -1_000_000_000, 1_000_000_000);
    const maximum =
      point.maximum == null
        ? null
        : finiteNumber(point.maximum, 'Sensor maximum', -1_000_000_000, 1_000_000_000);
    if (minimum != null && maximum != null && minimum > maximum) {
      throw new Error('Sensor range is invalid.');
    }
    return {
      day,
      value: finiteNumber(point.value, 'Sensor value', -1_000_000_000, 1_000_000_000),
      minimum,
      maximum,
      sampleCount: finiteNumber(point.sampleCount, 'Sensor samples', 0, 100_000),
    };
  });

  return {
    entityId: stringField(source.entityId, 'Sensor entity', 255),
    label: stringField(source.label, 'Sensor label', 160),
    deviceLabel: nullableString(source.deviceLabel, 'Device label', 160),
    areaLabel: nullableString(source.areaLabel, 'Area label', 160),
    groupId: stringField(source.groupId, 'Sensor group', 80),
    groupLabel: stringField(source.groupLabel, 'Sensor group label', 120),
    unit: nullableString(source.unit, 'Sensor unit', 40),
    unitClass: nullableString(source.unitClass, 'Sensor unit class', 80),
    aggregation,
    isArchived: source.isArchived === true,
    quality,
    qualityDetail: nullableString(source.qualityDetail, 'Sensor quality detail', 800),
    firstObservedAt: isoTimestamp(source.firstObservedAt, 'First observation'),
    dataThrough: isoTimestamp(source.dataThrough, 'Data through'),
    daily,
  };
}

/**
 * Accept only compact, normalised readings. This deliberately excludes raw
 * recorder states, event history, Home Assistant archives and credentials.
 */
export function parseSensorHistoryImport(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Sensor import payload is invalid.');
  }
  const sources = (value as Record<string, unknown>).sources;
  if (!Array.isArray(sources) || !sources.length || sources.length > MAX_SOURCES_PER_REQUEST) {
    throw new Error('Sensor import sources are invalid.');
  }
  const parsed = sources.map(parseSource);
  const entities = new Set<string>();
  for (const source of parsed) {
    if (entities.has(source.entityId)) {
      throw new Error('Sensor entities must be unique per import request.');
    }
    entities.add(source.entityId);
  }
  return parsed;
}
