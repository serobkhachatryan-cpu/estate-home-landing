import { getAuthenticatedViewer } from '@/lib/server/auth';
import { isLocalOrielImportRequest } from '@/lib/server/local-development';
import {
  replaceImportedUtilityHistory,
  type UtilityHistoryImportInput,
} from '@/lib/server/utility-history';

const MAX_DAILY_POINTS = 400;

function stringField(value: unknown, label: string, maximum = 500) {
  if (typeof value !== 'string') throw new Error(`${label} is required.`);
  const result = value.trim();
  if (!result || result.length > maximum) {
    throw new Error(`${label} is invalid.`);
  }
  return result;
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

function finiteNumber(value: unknown, label: string, maximum: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} is invalid.`);
  }
  if (value < 0 || value > maximum) throw new Error(`${label} is invalid.`);
  return value;
}

function parseImport(value: unknown): UtilityHistoryImportInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Import payload is invalid.');
  }
  const payload = value as Record<string, unknown>;
  const utility = payload.utility;
  if (utility !== 'electricity' && utility !== 'water') {
    throw new Error('Choose electricity or water.');
  }

  const source = payload.source;
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    throw new Error('Source details are required.');
  }
  const sourceValue = source as Record<string, unknown>;
  const quality = payload.quality;
  if (quality !== 'available' && quality !== 'needs_review') {
    throw new Error('Import quality is invalid.');
  }

  const candidatePoints = payload.daily;
  if (!Array.isArray(candidatePoints) || candidatePoints.length > MAX_DAILY_POINTS) {
    throw new Error('Daily readings are invalid.');
  }
  const seenDays = new Set<string>();
  const daily = candidatePoints.map((point) => {
    if (!point || typeof point !== 'object' || Array.isArray(point)) {
      throw new Error('Daily readings are invalid.');
    }
    const value = point as Record<string, unknown>;
    const day = isoDate(value.day, 'Day');
    if (seenDays.has(day)) throw new Error('Daily readings must be unique.');
    seenDays.add(day);
    return {
      day,
      consumption: finiteNumber(value.consumption, 'Consumption', 10_000_000),
    };
  });

  const rate = payload.ratePencePerUnit;
  const ratePencePerUnit =
    rate == null ? null : finiteNumber(rate, 'Configured rate', 100_000);
  const qualityDetail =
    payload.qualityDetail == null
      ? null
      : stringField(payload.qualityDetail, 'Quality detail', 800);

  return {
    utility,
    source: {
      label: stringField(sourceValue.label, 'Source label', 120),
      scope: stringField(sourceValue.scope, 'Source scope', 400),
      entityId: stringField(sourceValue.entityId, 'Source entity', 255),
      unit: stringField(sourceValue.unit, 'Unit', 40),
      timezone: stringField(sourceValue.timezone, 'Time zone', 80),
      firstObservedAt: isoTimestamp(
        sourceValue.firstObservedAt,
        'First observation',
      ),
      dataThrough: isoTimestamp(sourceValue.dataThrough, 'Data through'),
    },
    quality,
    qualityDetail,
    ratePencePerUnit,
    daily,
  };
}

/**
 * One-time local development importer for a private HA recorder export.
 * It is 404 outside Oriel's exact 127.0.0.1 profile and never accepts backup
 * files—only pre-normalized daily values from the local import script.
 */
export async function POST(request: Request) {
  if (!isLocalOrielImportRequest(request)) {
    return new Response(null, { status: 404 });
  }

  const viewer = await getAuthenticatedViewer();
  if (!viewer) return new Response(null, { status: 404 });

  try {
    const payload = parseImport(await request.json());
    await replaceImportedUtilityHistory(viewer.eName, payload);
    return Response.json(
      {
        status: 'imported',
        utility: payload.utility,
        dailyPointCount: payload.daily.length,
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'The historical import could not be processed.',
      },
      { status: 400, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }
}
