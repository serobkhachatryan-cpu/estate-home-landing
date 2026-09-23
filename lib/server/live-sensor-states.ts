import { database, ensureSchema } from '@/lib/server/database';
import type {
  LiveSensorGroupId,
  LiveSensorReading,
  LiveSensorSnapshotResponse,
} from '@/lib/live-sensor-types';

export const liveSensorGroups = {
  power: 'Power',
  water: 'Water',
  fuel: 'Fuel',
  climate: 'Climate',
  security: 'Security',
  network: 'Network',
  care: 'Care',
  sensors: 'Sensors',
} as const satisfies Record<LiveSensorGroupId, string>;

export type LiveSensorBridgeReading = Omit<LiveSensorReading, 'observedAt'>;

type LiveStateRow = {
  entity_id: string;
  group_id: LiveSensorGroupId;
  label: string;
  state: string;
  unit: string | null;
  state_updated_at: string;
  observed_at: string;
};

export function isLiveSensorGroupId(value: string): value is LiveSensorGroupId {
  return Object.hasOwn(liveSensorGroups, value);
}

function readingFromRow(row: LiveStateRow): LiveSensorReading {
  return {
    entityId: row.entity_id,
    groupId: row.group_id,
    label: row.label,
    state: row.state,
    unit: row.unit,
    stateUpdatedAt: row.state_updated_at,
    observedAt: row.observed_at,
  };
}

/**
 * Replaces one owner's explicitly allowlisted, current-state snapshot. The
 * bridge never sends Recorder history, configuration, credentials or control
 * commands, and Oriel deliberately does not keep a second telemetry archive.
 */
export async function replaceLiveSensorSnapshot(
  ownerEName: string,
  readings: LiveSensorBridgeReading[],
) {
  await ensureSchema();
  const db = database();
  const observedAt = new Date().toISOString();
  await db.batch([
    db
      .prepare('DELETE FROM home_assistant_live_states WHERE owner_ename = ?')
      .bind(ownerEName),
    ...readings.map((reading) =>
      db
        .prepare(
          `INSERT INTO home_assistant_live_states (
            owner_ename, entity_id, group_id, label, state, unit,
            state_updated_at, observed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          ownerEName,
          reading.entityId,
          reading.groupId,
          reading.label,
          reading.state,
          reading.unit,
          reading.stateUpdatedAt,
          observedAt,
        ),
    ),
  ]);
  return observedAt;
}

export async function getLiveSensorSnapshot(
  ownerEName: string,
  groupId?: LiveSensorGroupId,
): Promise<LiveSensorSnapshotResponse> {
  await ensureSchema();
  const db = database();
  const result = await (groupId
    ? db
        .prepare(
          `SELECT entity_id, group_id, label, state, unit, state_updated_at,
                  observed_at
           FROM home_assistant_live_states
           WHERE owner_ename = ? AND group_id = ?
           ORDER BY label, entity_id`,
        )
        .bind(ownerEName, groupId)
        .all<LiveStateRow>()
    : db
        .prepare(
          `SELECT entity_id, group_id, label, state, unit, state_updated_at,
                  observed_at
           FROM home_assistant_live_states
           WHERE owner_ename = ?
           ORDER BY group_id, label, entity_id`,
        )
        .bind(ownerEName)
        .all<LiveStateRow>());
  const readings = (result.results ?? []).map(readingFromRow);
  if (!readings.length) {
    return {
      status: 'not_configured',
      readings: [],
      detail:
        'The local Home Assistant bridge has not reported an allowlisted live sensor for this system yet.',
    };
  }

  return {
    status: 'available',
    readings,
    detail:
      'Current states read from Home Assistant by the local, read-only bridge.',
  };
}
