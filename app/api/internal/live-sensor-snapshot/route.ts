import { env } from 'cloudflare:workers';

import type { LiveSensorGroupId } from '@/lib/live-sensor-types';
import { getInvestorShareForRequest } from '@/lib/server/investor-share';
import {
  isLiveSensorGroupId,
  mergeLiveSensorSnapshot,
  replaceLiveSensorSnapshot,
  type LiveSensorBridgeReading,
} from '@/lib/server/live-sensor-states';
import {
  mergeImportedSensorCurrentWeeks,
  type SensorCurrentWeekImport,
} from '@/lib/server/sensor-history';

function sameSecret(received: string | null, expected: string | undefined) {
  if (!received || !expected || received.length !== expected.length)
    return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= received.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}

function bridgeSecret(request: Request) {
  const match = request.headers
    .get('authorization')
    ?.match(/^Bearer\s+([^\s]{32,128})$/i);
  return match?.[1] ?? null;
}

function limitedText(value: unknown, label: string, maximum: number) {
  if (typeof value !== 'string') throw new Error(`${label} is required.`);
  const text = value.trim();
  if (!text || text.length > maximum) throw new Error(`${label} is invalid.`);
  return text;
}

function ownerEName(value: unknown) {
  const result = limitedText(value, 'Snapshot owner', 120);
  if (!/^[a-z0-9_:@.-]+$/i.test(result)) {
    throw new Error('Snapshot owner is invalid.');
  }
  return result;
}

function timestamp(value: unknown, label: string) {
  const text = limitedText(value, label, 64);
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) throw new Error(`${label} is invalid.`);
  return date.toISOString();
}

function groupId(value: unknown): LiveSensorGroupId {
  if (typeof value !== 'string' || !isLiveSensorGroupId(value)) {
    throw new Error('Sensor group is invalid.');
  }
  return value;
}

function liveReading(value: unknown): LiveSensorBridgeReading {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Live sensor is invalid.');
  }
  const reading = value as Record<string, unknown>;
  const entityId = limitedText(reading.entityId, 'Sensor entity', 255);
  if (!/^sensor\.[a-zA-Z0-9_]+$/.test(entityId)) {
    throw new Error('Sensor entity is invalid.');
  }
  const unit =
    reading.unit == null ? null : limitedText(reading.unit, 'Unit', 40);
  return {
    entityId,
    groupId: groupId(reading.groupId),
    label: limitedText(reading.label, 'Sensor label', 160),
    state: limitedText(reading.state, 'Sensor state', 160),
    unit,
    stateUpdatedAt: timestamp(reading.stateUpdatedAt, 'Sensor updated time'),
  };
}

function finiteNumber(value: unknown, label: string) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${label} is invalid.`);
  }
  if (Math.abs(value) > 1_000_000_000) {
    throw new Error(`${label} is invalid.`);
  }
  return value;
}

function weekStart(value: unknown) {
  const day = limitedText(value, 'Week start', 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
    throw new Error('Week start is invalid.');
  }
  const date = new Date(`${day}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.getUTCDay() !== 1) {
    throw new Error('Week start must be a Monday.');
  }
  return day;
}

function currentWeek(value: unknown): SensorCurrentWeekImport {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Current week is invalid.');
  }
  const week = value as Record<string, unknown>;
  const entityId = limitedText(week.entityId, 'Sensor entity', 255);
  if (!/^sensor\.[a-zA-Z0-9_]+$/.test(entityId)) {
    throw new Error('Sensor entity is invalid.');
  }
  const minimum =
    week.minimum == null ? null : finiteNumber(week.minimum, 'Week minimum');
  const maximum =
    week.maximum == null ? null : finiteNumber(week.maximum, 'Week maximum');
  if (minimum != null && maximum != null && minimum > maximum) {
    throw new Error('Current week range is invalid.');
  }
  const dayCount = finiteNumber(week.dayCount, 'Week day count');
  if (!Number.isInteger(dayCount) || dayCount < 1 || dayCount > 7) {
    throw new Error('Week day count is invalid.');
  }
  return {
    entityId,
    weekStart: weekStart(week.weekStart),
    value: finiteNumber(week.value, 'Week value'),
    minimum,
    maximum,
    dayCount,
    observedAt: timestamp(week.observedAt, 'Week observed time'),
  };
}

async function snapshotOwner(
  body: Record<string, unknown>,
  requestUrl: string,
) {
  const suppliedOwner =
    typeof body.ownerEName === 'string' ? body.ownerEName.trim() : '';
  const suppliedShare =
    typeof body.investorShare === 'string' ? body.investorShare.trim() : '';
  if (suppliedOwner && suppliedShare) {
    throw new Error(
      'Use either a snapshot owner or an investor share, not both.',
    );
  }
  if (suppliedOwner) return ownerEName(suppliedOwner);
  if (!suppliedShare) throw new Error('Snapshot owner is required.');

  // A bridge already authorized by its own secret can make a one-time setup
  // request with an existing investor-link secret. This resolves the same D1
  // owner mapping that the investor API uses, but never returns the eID or
  // stores the investor secret in a live snapshot.
  const share = await getInvestorShareForRequest(
    new Request(requestUrl, {
      headers: { Authorization: `Bearer ${suppliedShare}` },
    }),
  );
  if (!share) throw new Error('Investor share is unavailable.');
  return share.ownerEName;
}

/**
 * The only hosted ingestion route for the local bridge. It accepts a tiny
 * replacement snapshot of allowed sensor states and is intentionally absent
 * unless a separately configured secret authorizes it.
 */
export async function POST(request: Request) {
  const configured = (env as { ORIEL_LIVE_BRIDGE_TOKEN?: string })
    .ORIEL_LIVE_BRIDGE_TOKEN;
  if (!sameSecret(bridgeSecret(request), configured)) {
    return new Response(null, { status: 404 });
  }

  try {
    const payload: unknown = await request.json();
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('Live snapshot payload is invalid.');
    }
    const body = payload as Record<string, unknown>;
    const mode = body.mode;
    if (mode === 'current_week') {
      if (!Array.isArray(body.weeks) || !body.weeks.length) {
        throw new Error('At least one current week is required.');
      }
      if (body.weeks.length > 100) {
        throw new Error('Too many current weeks were supplied.');
      }
      const weeks = body.weeks.map(currentWeek);
      if (new Set(weeks.map((week) => week.entityId)).size !== weeks.length) {
        throw new Error('Each current-week sensor must be unique.');
      }
      const owner = await snapshotOwner(body, request.url);
      await mergeImportedSensorCurrentWeeks(owner, weeks);
      return Response.json(
        { status: 'accepted', sensorCount: weeks.length },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const liveMode = mode === 'merge' ? 'merge' : 'replace';
    if (!Array.isArray(body.readings) || !body.readings.length) {
      throw new Error('At least one live sensor is required.');
    }
    if (body.readings.length > (liveMode === 'merge' ? 100 : 40)) {
      throw new Error('Too many live sensors were supplied.');
    }
    const readings = body.readings.map(liveReading);
    if (
      new Set(readings.map((reading) => reading.entityId)).size !==
      readings.length
    ) {
      throw new Error('Each live sensor must be unique.');
    }
    const owner = await snapshotOwner(body, request.url);
    const observedAt =
      liveMode === 'merge'
        ? await mergeLiveSensorSnapshot(owner, readings)
        : await replaceLiveSensorSnapshot(owner, readings);
    return Response.json(
      { status: 'accepted', sensorCount: readings.length, observedAt },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'The live Home Assistant snapshot could not be processed.',
      },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
