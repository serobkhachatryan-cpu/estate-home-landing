import { database, ensureSchema } from '@/lib/server/database';
import type {
  ImportedSensorDay,
  ImportedSensorGroup,
  ImportedSensorSummary,
  SensorHistoryAggregation,
  SensorHistoryOverviewResponse,
  SensorHistoryQuality,
  SensorHistorySourceResponse,
} from '@/lib/sensor-history-types';

export type SensorHistoryImportDay = {
  day: string;
  value: number;
  minimum?: number | null;
  maximum?: number | null;
  sampleCount: number;
};

export type SensorHistoryImportSource = {
  entityId: string;
  label: string;
  deviceLabel?: string | null;
  areaLabel?: string | null;
  groupId: string;
  groupLabel: string;
  unit?: string | null;
  unitClass?: string | null;
  aggregation: SensorHistoryAggregation;
  isArchived: boolean;
  quality: SensorHistoryQuality;
  qualityDetail?: string | null;
  firstObservedAt: string;
  dataThrough: string;
  daily: SensorHistoryImportDay[];
};

type ImportRow = {
  entity_id: string;
  label: string;
  device_label: string | null;
  area_label: string | null;
  group_id: string;
  group_label: string;
  unit: string | null;
  unit_class: string | null;
  aggregation: SensorHistoryAggregation;
  is_archived: number;
  quality: SensorHistoryQuality;
  quality_detail: string | null;
  first_observed_at: string;
  data_through: string;
  point_count: number;
};

type PointRow = {
  day: string;
  value: number;
  minimum: number | null;
  maximum: number | null;
  sample_count: number;
};

function round(value: number, precision = 3) {
  const scale = 10 ** precision;
  return Math.round((value + Number.EPSILON) * scale) / scale;
}

function sourceFromRow(row: ImportRow): ImportedSensorSummary {
  return {
    entityId: row.entity_id,
    label: row.label,
    deviceLabel: row.device_label,
    areaLabel: row.area_label,
    groupId: row.group_id,
    groupLabel: row.group_label,
    unit: row.unit,
    unitClass: row.unit_class,
    aggregation: row.aggregation,
    isArchived: Boolean(row.is_archived),
    quality: row.quality,
    qualityDetail: row.quality_detail,
    firstObservedAt: row.first_observed_at,
    dataThrough: row.data_through,
    pointCount: Number(row.point_count),
    latest: null,
    last7Days: null,
  };
}

function pointFromRow(row: PointRow): ImportedSensorDay {
  return {
    date: row.day,
    value: round(Number(row.value)),
    minimum: row.minimum == null ? null : round(Number(row.minimum)),
    maximum: row.maximum == null ? null : round(Number(row.maximum)),
    sampleCount: Number(row.sample_count),
  };
}

function summaryForPoints(
  source: ImportedSensorSummary,
  latestFirst: PointRow[],
) {
  const latest = latestFirst[0];
  if (latest) {
    source.latest = {
      day: latest.day,
      value: round(Number(latest.value)),
      minimum: latest.minimum == null ? null : round(Number(latest.minimum)),
      maximum: latest.maximum == null ? null : round(Number(latest.maximum)),
    };
  }

  const window = latestFirst.slice(0, 7);
  if (window.length) {
    const values = window.map((point) => Number(point.value));
    const total = values.reduce((sum, value) => sum + value, 0);
    source.last7Days = {
      value: round(
        source.aggregation === 'daily_total' ? total : total / values.length,
      ),
      dayCount: window.length,
      from: window.at(-1)?.day ?? window[0]!.day,
      to: window[0]!.day,
    };
  }
}

/**
 * The local importer sends vetted, normalized daily values in small batches.
 * It never uploads a Home Assistant archive or credential-bearing config.
 */
export async function replaceImportedSensorHistory(
  ownerEName: string,
  sources: SensorHistoryImportSource[],
) {
  await ensureSchema();
  const db = database();
  const importedAt = new Date().toISOString();

  const removals = sources.flatMap((source) => [
    db
      .prepare(
        `DELETE FROM sensor_history_daily_points
         WHERE owner_ename = ? AND entity_id = ?`,
      )
      .bind(ownerEName, source.entityId),
    db
      .prepare(
        `DELETE FROM sensor_history_imports
         WHERE owner_ename = ? AND entity_id = ?`,
      )
      .bind(ownerEName, source.entityId),
  ]);
  for (let index = 0; index < removals.length; index += 100) {
    await db.batch(removals.slice(index, index + 100));
  }

  const imports = sources.map((source) =>
    db
      .prepare(
        `INSERT INTO sensor_history_imports (
          owner_ename, entity_id, label, device_label, area_label,
          group_id, group_label, unit, unit_class, aggregation,
          is_archived,
          first_observed_at, data_through, imported_at, quality,
          quality_detail, point_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        ownerEName,
        source.entityId,
        source.label,
        source.deviceLabel ?? null,
        source.areaLabel ?? null,
        source.groupId,
        source.groupLabel,
        source.unit ?? null,
        source.unitClass ?? null,
        source.aggregation,
        source.isArchived ? 1 : 0,
        source.firstObservedAt,
        source.dataThrough,
        importedAt,
        source.quality,
        source.qualityDetail ?? null,
        source.daily.length,
      ),
  );
  for (let index = 0; index < imports.length; index += 100) {
    await db.batch(imports.slice(index, index + 100));
  }

  const points = sources.flatMap((source) =>
    source.daily.map((day) =>
      db
        .prepare(
          `INSERT INTO sensor_history_daily_points (
            owner_ename, entity_id, day, value, minimum, maximum, sample_count
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          ownerEName,
          source.entityId,
          day.day,
          day.value,
          day.minimum ?? null,
          day.maximum ?? null,
          day.sampleCount,
        ),
    ),
  );
  for (let index = 0; index < points.length; index += 100) {
    await db.batch(points.slice(index, index + 100));
  }
}

export async function getImportedSensorOverview(
  ownerEName: string,
  groupId?: string,
): Promise<SensorHistoryOverviewResponse> {
  await ensureSchema();
  const db = database();
  const imports = await (groupId
    ? db
        .prepare(
          `SELECT entity_id, label, device_label, area_label, group_id,
                  group_label, unit, unit_class, aggregation, quality,
                  is_archived,
                  quality_detail, first_observed_at, data_through, point_count
           FROM sensor_history_imports
           WHERE owner_ename = ? AND group_id = ?
           ORDER BY group_label, label, entity_id`,
        )
        .bind(ownerEName, groupId)
        .all<ImportRow>()
    : db
        .prepare(
          `SELECT entity_id, label, device_label, area_label, group_id,
                  group_label, unit, unit_class, aggregation, quality,
                  is_archived,
                  quality_detail, first_observed_at, data_through, point_count
           FROM sensor_history_imports
           WHERE owner_ename = ?
           ORDER BY group_label, label, entity_id`,
        )
        .bind(ownerEName)
        .all<ImportRow>());
  const sources = (imports.results ?? []).map(sourceFromRow);
  if (!sources.length) {
    return {
      status: 'not_imported',
      groups: [],
      sources: [],
      detail: 'No normalized Home Assistant statistics have been imported yet.',
    };
  }

  await Promise.all(
    sources.map(async (source) => {
      const result = await db
        .prepare(
          `SELECT day, value, minimum, maximum, sample_count
           FROM sensor_history_daily_points
           WHERE owner_ename = ? AND entity_id = ?
           ORDER BY day DESC
           LIMIT 7`,
        )
        .bind(ownerEName, source.entityId)
        .all<PointRow>();
      summaryForPoints(source, result.results ?? []);
    }),
  );

  const byGroup = new Map<string, ImportedSensorGroup>();
  for (const source of sources) {
    const existing = byGroup.get(source.groupId) ?? {
      id: source.groupId,
      label: source.groupLabel,
      sourceCount: 0,
      availableCount: 0,
    };
    existing.sourceCount += 1;
    if (source.quality === 'available' && source.pointCount > 0) {
      existing.availableCount += 1;
    }
    byGroup.set(source.groupId, existing);
  }

  return {
    status: 'available',
    groups: [...byGroup.values()].sort((left, right) =>
      left.label.localeCompare(right.label),
    ),
    sources,
    detail:
      'Normalized from Home Assistant long-term statistics. Cumulative meters use validated daily deltas; measurements use complete-day averages.',
  };
}

export async function getImportedSensorHistory(
  ownerEName: string,
  entityId: string,
): Promise<SensorHistorySourceResponse> {
  await ensureSchema();
  const db = database();
  const imported = await db
    .prepare(
      `SELECT entity_id, label, device_label, area_label, group_id,
              group_label, unit, unit_class, aggregation, quality,
              is_archived,
              quality_detail, first_observed_at, data_through, point_count
       FROM sensor_history_imports
       WHERE owner_ename = ? AND entity_id = ?
       LIMIT 1`,
    )
    .bind(ownerEName, entityId)
    .first<ImportRow>();
  if (!imported) {
    return {
      status: 'not_imported',
      detail: 'This Home Assistant sensor has not been imported.',
    };
  }

  const source = sourceFromRow(imported);
  const points = await db
    .prepare(
      `SELECT day, value, minimum, maximum, sample_count
       FROM sensor_history_daily_points
       WHERE owner_ename = ? AND entity_id = ?
       ORDER BY day ASC
       LIMIT 400`,
    )
    .bind(ownerEName, entityId)
    .all<PointRow>();
  const daily = (points.results ?? []).map(pointFromRow);
  summaryForPoints(source, [...(points.results ?? [])].reverse().slice(0, 7));

  return {
    status: 'available',
    source,
    daily,
    detail:
      source.qualityDetail ??
      'Only complete, normalized daily observations are displayed.',
  };
}
