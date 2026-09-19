import { database, ensureSchema } from '@/lib/server/database';

export type ImportedUtilityKind = 'electricity' | 'water';

export type UtilityHistoryImportPoint = {
  day: string;
  consumption: number;
};

export type UtilityHistoryImportInput = {
  utility: ImportedUtilityKind;
  source: {
    label: string;
    scope: string;
    entityId: string;
    unit: string;
    timezone: string;
    firstObservedAt: string;
    dataThrough: string;
  };
  quality: 'available' | 'needs_review';
  qualityDetail?: string | null;
  ratePencePerUnit?: number | null;
  daily: UtilityHistoryImportPoint[];
};

type ImportRow = {
  source_label: string;
  source_scope: string;
  source_entity_id: string;
  unit: string;
  timezone: string;
  first_observed_at: string;
  data_through: string;
  imported_at: string;
  quality: 'available' | 'needs_review';
  quality_detail: string | null;
  rate_pence_per_unit: number | null;
};

type PointRow = {
  day: string;
  consumption: number;
};

function round(value: number, precision = 3) {
  const scale = 10 ** precision;
  return Math.round((value + Number.EPSILON) * scale) / scale;
}

function sum(points: PointRow[]) {
  return round(points.reduce((total, point) => total + point.consumption, 0));
}

function historySource(row: ImportRow) {
  return {
    label: row.source_label,
    scope: row.source_scope,
    entityId: row.source_entity_id,
    unit: row.unit,
    timezone: row.timezone,
    firstObservedAt: row.first_observed_at,
    dataThrough: row.data_through,
    importedAt: row.imported_at,
  };
}

function missingHistorySource() {
  return {
    label: 'No historical source selected',
    scope: null,
    entityId: null,
    unit: null,
    timezone: null,
    firstObservedAt: null,
    dataThrough: null,
    importedAt: null,
  };
}

/**
 * Replaces a local, owner-scoped import atomically per source before inserting
 * normalized daily points. Raw Home Assistant backup material never enters D1.
 */
export async function replaceImportedUtilityHistory(
  ownerEName: string,
  input: UtilityHistoryImportInput,
) {
  await ensureSchema();
  const db = database();
  const importedAt = new Date().toISOString();

  await db.batch([
    db
      .prepare(
        `DELETE FROM utility_history_daily_points
         WHERE owner_ename = ? AND utility = ?`,
      )
      .bind(ownerEName, input.utility),
    db
      .prepare(
        `DELETE FROM utility_history_imports
         WHERE owner_ename = ? AND utility = ?`,
      )
      .bind(ownerEName, input.utility),
    db
      .prepare(
        `INSERT INTO utility_history_imports (
          owner_ename, utility, source_label, source_scope, source_entity_id,
          unit, timezone, first_observed_at, data_through, imported_at,
          quality, quality_detail, rate_pence_per_unit
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        ownerEName,
        input.utility,
        input.source.label,
        input.source.scope,
        input.source.entityId,
        input.source.unit,
        input.source.timezone,
        input.source.firstObservedAt,
        input.source.dataThrough,
        importedAt,
        input.quality,
        input.qualityDetail ?? null,
        input.ratePencePerUnit ?? null,
      ),
  ]);

  const points = input.daily.map((point) =>
    db
      .prepare(
        `INSERT INTO utility_history_daily_points (
          owner_ename, utility, day, consumption
        ) VALUES (?, ?, ?, ?)`,
      )
      .bind(ownerEName, input.utility, point.day, point.consumption),
  );

  // D1 batches have request-size limits. Keeping each local import small also
  // lets a retry recover cleanly after an interrupted developer session.
  for (let index = 0; index < points.length; index += 100) {
    await db.batch(points.slice(index, index + 100));
  }
}

export async function getImportedUtilityHistory(
  ownerEName: string,
  utility: ImportedUtilityKind,
) {
  await ensureSchema();
  const db = database();
  const imported = await db
    .prepare(
      `SELECT source_label, source_scope, source_entity_id, unit, timezone,
              first_observed_at, data_through, imported_at, quality,
              quality_detail, rate_pence_per_unit
       FROM utility_history_imports
       WHERE owner_ename = ? AND utility = ?
       LIMIT 1`,
    )
    .bind(ownerEName, utility)
    .first<ImportRow>();

  if (!imported) {
    return {
      status: 'not_imported' as const,
      utility,
      source: missingHistorySource(),
      detail: 'No verified historical utility import is available yet.',
    };
  }

  if (imported.quality === 'needs_review') {
    return {
      status: 'needs_review' as const,
      utility,
      source: historySource(imported),
      detail:
        imported.quality_detail ??
        'This meter history needs review before Oriel can publish consumption figures.',
    };
  }

  const result = await db
    .prepare(
      `SELECT day, consumption
       FROM utility_history_daily_points
       WHERE owner_ename = ? AND utility = ?
       ORDER BY day DESC
       LIMIT 400`,
    )
    .bind(ownerEName, utility)
    .all<PointRow>();
  const latestFirst = (result.results ?? []).map((point) => ({
    day: point.day,
    consumption: Number(point.consumption),
  }));

  if (!latestFirst.length) {
    return {
      status: 'needs_review' as const,
      utility,
      source: historySource(imported),
      detail:
        'The source was imported, but no complete daily intervals were safe to publish.',
    };
  }

  const lastSeven = latestFirst.slice(0, 7);
  const latestDay = latestFirst[0]!.day;
  const currentMonth = latestDay.slice(0, 7);
  const monthToDate = latestFirst.filter((point) =>
    point.day.startsWith(currentMonth),
  );
  const monthConsumption = sum(monthToDate);
  const rate = imported.rate_pence_per_unit;

  return {
    status: 'available' as const,
    utility,
    source: historySource(imported),
    summary: {
      last7Days: {
        value: sum(lastSeven),
        from: lastSeven.at(-1)?.day ?? latestDay,
        to: latestDay,
      },
      monthToDate: {
        value: monthConsumption,
        from: monthToDate.at(-1)?.day ?? latestDay,
        to: latestDay,
      },
      averageDaily: round(sum(lastSeven) / lastSeven.length),
      costEstimate:
        typeof rate === 'number' && Number.isFinite(rate)
          ? {
              amountPence: Math.round(monthConsumption * rate),
              ratePencePerUnit: rate,
              from: monthToDate.at(-1)?.day ?? latestDay,
              to: latestDay,
            }
          : null,
    },
    daily: latestFirst.slice(0, 14).reverse().map((point) => ({
      date: point.day,
      value: round(point.consumption),
    })),
    detail:
      imported.quality_detail ??
      'Normalized from Home Assistant long-term statistics; only complete daily intervals are shown.',
  };
}
