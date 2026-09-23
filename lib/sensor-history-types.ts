/**
 * Browser-safe representation of historical Home Assistant statistics.
 * Raw recorder rows and the Home Assistant backup never leave the local
 * import process.
 */
export type SensorHistoryAggregation = 'daily_total' | 'daily_average';

export type SensorHistoryQuality = 'available' | 'needs_review';

/**
 * An in-progress week-to-date value from the owner-operated Home Assistant
 * bridge. It is deliberately separate from the verified daily archive.
 */
export type ImportedSensorCurrentWeek = {
  weekStart: string;
  value: number;
  minimum: number | null;
  maximum: number | null;
  dayCount: number;
  observedAt: string;
};

export type ImportedSensorSummary = {
  entityId: string;
  label: string;
  deviceLabel: string | null;
  areaLabel: string | null;
  groupId: string;
  groupLabel: string;
  unit: string | null;
  unitClass: string | null;
  aggregation: SensorHistoryAggregation;
  isArchived: boolean;
  quality: SensorHistoryQuality;
  qualityDetail: string | null;
  firstObservedAt: string;
  dataThrough: string;
  pointCount: number;
  latest: {
    day: string;
    value: number;
    minimum: number | null;
    maximum: number | null;
  } | null;
  last7Days: {
    value: number;
    dayCount: number;
    from: string;
    to: string;
  } | null;
  currentWeek: ImportedSensorCurrentWeek | null;
};

export type ImportedSensorDay = {
  date: string;
  value: number;
  minimum: number | null;
  maximum: number | null;
  sampleCount: number;
};

export type ImportedSensorGroup = {
  id: string;
  label: string;
  sourceCount: number;
  availableCount: number;
};

export type SensorHistoryOverviewResponse = {
  status: 'available' | 'not_imported';
  groups: ImportedSensorGroup[];
  sources: ImportedSensorSummary[];
  detail: string;
};

export type SensorHistorySourceResponse = {
  status: 'available' | 'not_imported';
  source?: ImportedSensorSummary;
  daily?: ImportedSensorDay[];
  detail: string;
};
