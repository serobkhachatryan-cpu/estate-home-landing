'use client';

import { AlertTriangle, History, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import type {
  ImportedUtilityHistoryDay,
  ImportedUtilityHistoryResponse,
  ImportedUtilityHistorySource,
  UtilityHistoryKind,
} from '@/lib/utility-history-types';

type LoadState =
  | { phase: 'loading' }
  | { phase: 'error' }
  | { phase: 'ready'; data: ImportedUtilityHistoryResponse };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === 'string' || value === null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Keep the browser defensive: an incomplete local import should be shown as a
 * recoverable error instead of making an unverified number look authoritative.
 */
function isUtilityHistoryResponse(
  value: unknown,
): value is ImportedUtilityHistoryResponse {
  if (!isRecord(value)) return false;
  if (
    value.status !== 'available' &&
    value.status !== 'not_imported' &&
    value.status !== 'needs_review'
  ) {
    return false;
  }
  if (value.utility !== 'electricity' && value.utility !== 'water') return false;
  if (typeof value.detail !== 'string' || !isRecord(value.source)) return false;

  const source = value.source;
  if (
    typeof source.label !== 'string' ||
    !isNullableString(source.entityId) ||
    !isNullableString(source.scope) ||
    !isNullableString(source.unit) ||
    !isNullableString(source.timezone) ||
    !isNullableString(source.firstObservedAt) ||
    !isNullableString(source.dataThrough) ||
    !isNullableString(source.importedAt)
  ) {
    return false;
  }

  if (value.summary !== undefined) {
    if (!isRecord(value.summary) || !isFiniteNumber(value.summary.averageDaily)) {
      return false;
    }
    for (const window of [value.summary.last7Days, value.summary.monthToDate]) {
      if (
        !isRecord(window) ||
        !isFiniteNumber(window.value) ||
        typeof window.from !== 'string' ||
        typeof window.to !== 'string'
      ) {
        return false;
      }
    }
    if (value.summary.costEstimate !== undefined && value.summary.costEstimate !== null) {
      if (
        !isRecord(value.summary.costEstimate) ||
        !isFiniteNumber(value.summary.costEstimate.amountPence) ||
        !isFiniteNumber(value.summary.costEstimate.ratePencePerUnit)
      ) {
        return false;
      }
    }
  }

  if (value.daily !== undefined) {
    if (!Array.isArray(value.daily)) return false;
    return value.daily.every(
      (day) =>
        isRecord(day) && typeof day.date === 'string' && isFiniteNumber(day.value),
    );
  }

  return true;
}

function formatDate(
  value: string | null,
  withTime = false,
  timeZone?: string | null,
) {
  if (!value) return 'Not recorded';
  const isCalendarDate = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const input = isCalendarDate ? `${value}T12:00:00Z` : value;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return 'Not recorded';

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(timeZone ? { timeZone } : {}),
    ...(!isCalendarDate && withTime
      ? { hour: 'numeric', minute: '2-digit' }
      : {}),
  }).format(date);
}

function formatDateRange(from: string, to: string) {
  const start = formatDate(from);
  const end = formatDate(to);
  return start === end ? start : `${start} – ${end}`;
}

function fractionDigitsFor(unit: string | null) {
  if (!unit) return 1;
  if (/^l$/i.test(unit.trim())) return 0;
  if (/m(?:³|3)|litre|liter/i.test(unit)) return 2;
  return 1;
}

function formatConsumption(value: number, unit: string | null) {
  const digits = fractionDigitsFor(unit);
  const amount = new Intl.NumberFormat('en-GB', {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(value);
  return unit ? `${amount} ${unit}` : amount;
}

function formatPounds(amountPence: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountPence / 100);
}

function SourceDetails({ source }: { source: ImportedUtilityHistorySource }) {
  return (
    <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 border-t border-[#e8e1d7] pt-3 text-[11px] text-[#52626c] sm:grid-cols-2">
      <div className="min-w-0">
        <dt className="font-medium text-[#6b777f]">Historical source</dt>
        <dd className="mt-0.5 truncate text-[#153044]">{source.label}</dd>
      </div>
      <div className="min-w-0 sm:text-right">
        <dt className="font-medium text-[#6b777f]">Data through</dt>
        <dd className="mt-0.5 text-[#153044]">
          {formatDate(source.dataThrough, true, source.timezone)}
        </dd>
      </div>
      {source.entityId ? (
        <div className="min-w-0">
          <dt className="font-medium text-[#6b777f]">Home Assistant entity</dt>
          <dd className="mt-0.5 break-all font-mono text-[10px] text-[#153044]">
            {source.entityId}
          </dd>
        </div>
      ) : null}
      {source.scope ? (
        <div className="min-w-0 sm:text-right">
          <dt className="font-medium text-[#6b777f]">Import scope</dt>
          <dd className="mt-0.5 text-[#153044]">{source.scope}</dd>
        </div>
      ) : null}
    </dl>
  );
}

function Metric({
  label,
  value,
  context,
}: {
  label: string;
  value: string;
  context: string;
}) {
  return (
    <div className="rounded-xl border border-[#e0d8cb] bg-[#f7f3ec] px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8f7040]">
        {label}
      </p>
      <p className="mt-1 text-[1.2rem] font-semibold leading-none tracking-[-0.04em] tabular-nums text-[#153044]">
        {value}
      </p>
      <p className="mt-1.5 text-[10px] leading-4 text-[#6b777f]">{context}</p>
    </div>
  );
}

function RecentDays({
  days,
  unit,
}: {
  days: ImportedUtilityHistoryDay[];
  unit: string | null;
}) {
  const recentDays = useMemo(
    () =>
      [...days]
        .filter((day) => !Number.isNaN(new Date(day.date).getTime()))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 7),
    [days],
  );

  return (
    <div className="mt-4 border-t border-[#e8e1d7] pt-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
          Recent daily use
        </p>
        <p className="text-[10px] text-[#6b777f]">Recorded consumption</p>
      </div>
      {recentDays.length ? (
        <ul className="mt-2 divide-y divide-[#eee8de]">
          {recentDays.map((day) => (
            <li
              key={day.date}
              className="flex items-center justify-between gap-3 py-2 text-[12px]"
            >
              <span className="text-[#52626c]">{formatDate(day.date)}</span>
              <span className="font-semibold tabular-nums text-[#153044]">
                {formatConsumption(day.value, unit)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-[12px] leading-5 text-[#52626c]">
          No complete daily readings were found in this import.
        </p>
      )}
    </div>
  );
}

function LoadingCard() {
  return (
    <section
      aria-busy="true"
      aria-live="polite"
      className="mb-4 overflow-hidden rounded-2xl border border-[#d4cdbf] bg-[#fcfbf8] px-4 py-4"
    >
      <div className="flex items-center gap-2">
        <History className="size-4 text-[#8f7040]" strokeWidth={1.8} />
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
          Imported history
        </p>
      </div>
      <p className="mt-2 text-[13px] text-[#52626c]">
        Loading recorded utility history…
      </p>
    </section>
  );
}

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      aria-live="polite"
      className="mb-4 overflow-hidden rounded-2xl border border-[#e0c4b0] bg-[#fdf8f5] px-4 py-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-[#a86648]" strokeWidth={1.8} />
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
              History unavailable
            </p>
          </div>
          <p className="mt-2 text-[13px] leading-5 text-[#52626c]">
            Oriel could not load the imported utility history right now. No
            consumption figure is being shown as verified.
          </p>
        </div>
        <Button
          variant="ghost"
          className="h-8 shrink-0 rounded-full px-3 text-[12px] text-[#815f2c] hover:bg-[#efe7da] hover:text-[#5b421b]"
          onClick={onRetry}
        >
          <RefreshCw className="mr-1.5 size-3.5" />
          Retry
        </Button>
      </div>
    </div>
  );
}

/**
 * A read-only view of normalised utility history imported from a Home
 * Assistant backup. It deliberately never receives raw recorder rows.
 */
export function ImportedUtilityHistory({
  utility,
}: {
  utility: UtilityHistoryKind;
}) {
  const [state, setState] = useState<LoadState>({ phase: 'loading' });
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setState({ phase: 'loading' });
    setAttempt((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetch(`/api/utility-history/${utility}`, {
          cache: 'no-store',
          credentials: 'same-origin',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Could not load utility history.');

        const payload: unknown = await response.json();
        if (!isUtilityHistoryResponse(payload)) {
          throw new Error('Invalid utility history response.');
        }
        if (!controller.signal.aborted) {
          setState({ phase: 'ready', data: payload });
        }
      } catch {
        if (!controller.signal.aborted) setState({ phase: 'error' });
      }
    })();

    return () => controller.abort();
  }, [attempt, utility]);

  if (state.phase === 'loading') return <LoadingCard />;
  if (state.phase === 'error') return <ErrorCard onRetry={retry} />;

  const { data } = state;
  const source = data.source;

  if (data.status === 'needs_review') {
    return (
      <section className="mb-4 overflow-hidden rounded-2xl border border-[#e0d2a8] bg-[#fdfaf2] px-4 py-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#a88348]" strokeWidth={1.8} />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
              Imported history needs review
            </p>
            <p className="mt-1 text-[13px] leading-5 text-[#52626c]">
              {data.detail ||
                'The meter history has a continuity issue. Oriel is withholding consumption figures until it has been reviewed.'}
            </p>
          </div>
        </div>
        <SourceDetails source={source} />
      </section>
    );
  }

  if (
    data.status !== 'available' ||
    !data.summary ||
    !data.daily
  ) {
    return (
      <section className="mb-4 overflow-hidden rounded-2xl border border-[#d4cdbf] bg-[#fcfbf8] px-4 py-4">
        <div className="flex items-center gap-2">
          <History className="size-4 text-[#8f7040]" strokeWidth={1.8} />
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
            Imported history
          </p>
        </div>
        <p className="mt-2 text-[13px] leading-5 text-[#52626c]">
          {data.detail ||
            'No recorded meter history has been selected for this utility yet.'}
        </p>
        <SourceDetails source={source} />
      </section>
    );
  }

  const { summary } = data;
  const costEstimate =
    utility === 'electricity' ? summary.costEstimate ?? null : null;

  return (
    <section
      aria-label="Imported utility history"
      className="mb-4 overflow-hidden rounded-2xl border border-[#d4cdbf] bg-[#fcfbf8] px-4 py-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <History className="size-4 text-[#8f7040]" strokeWidth={1.8} />
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
              Imported history
            </p>
          </div>
          <p className="mt-1 text-[13px] leading-5 text-[#52626c]">
            {data.detail || 'Recorded consumption from the selected meter source.'}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-[#c5d4c0] bg-[#eef4ea] px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.04em] text-[#2f4a34]">
          Recorded
        </span>
      </div>

      <SourceDetails source={source} />

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Metric
          label="Last 7 days"
          value={formatConsumption(summary.last7Days.value, source.unit)}
          context={formatDateRange(summary.last7Days.from, summary.last7Days.to)}
        />
        <Metric
          label="Month to date"
          value={formatConsumption(summary.monthToDate.value, source.unit)}
          context={formatDateRange(summary.monthToDate.from, summary.monthToDate.to)}
        />
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Metric
          label="Average day"
          value={formatConsumption(summary.averageDaily, source.unit)}
          context="Across the imported recorded days"
        />
        {costEstimate ? (
          <Metric
            label="Energy cost estimate"
            value={formatPounds(costEstimate.amountPence)}
            context={`Estimate at configured rate, not an invoice. ${costEstimate.ratePencePerUnit.toFixed(2)}p per ${source.unit ?? 'unit'}.`}
          />
        ) : null}
      </div>

      <RecentDays days={data.daily} unit={source.unit} />
    </section>
  );
}
