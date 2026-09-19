/**
 * Client-safe contract for normalised, private utility history. The raw Home
 * Assistant recorder database is never sent to the browser.
 */
export type UtilityHistoryKind = 'electricity' | 'water';

export type UtilityHistoryStatus =
  | 'available'
  | 'not_imported'
  | 'needs_review';

export type ImportedUtilityHistorySource = {
  label: string;
  entityId: string | null;
  scope: string | null;
  unit: string | null;
  timezone: string | null;
  firstObservedAt: string | null;
  dataThrough: string | null;
  importedAt: string | null;
};

export type ImportedUtilityHistoryWindow = {
  value: number;
  from: string;
  to: string;
};

export type ImportedUtilityHistoryCostEstimate = {
  /** Monetary amount in pence, deliberately separate from invoice data. */
  amountPence: number;
  /** Configured unit rate in pence, for context only. */
  ratePencePerUnit: number;
};

export type ImportedUtilityHistorySummary = {
  last7Days: ImportedUtilityHistoryWindow;
  monthToDate: ImportedUtilityHistoryWindow;
  averageDaily: number;
  costEstimate?: ImportedUtilityHistoryCostEstimate | null;
};

export type ImportedUtilityHistoryDay = {
  /** ISO calendar date in the property's configured time zone. */
  date: string;
  value: number;
};

export type ImportedUtilityHistoryResponse = {
  status: UtilityHistoryStatus;
  utility: UtilityHistoryKind;
  source: ImportedUtilityHistorySource;
  summary?: ImportedUtilityHistorySummary;
  daily?: ImportedUtilityHistoryDay[];
  /** A human-readable import or data-quality note supplied by the server. */
  detail: string;
};
