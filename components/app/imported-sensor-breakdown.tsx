'use client';

import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  MeasuredWeeklyTape,
  type MeasuredTapePoint,
} from '@/components/app/spend-weekly-tape';
import { Button } from '@/components/ui/button';
import type {
  ImportedSensorDay,
  ImportedSensorSummary,
  SensorHistoryOverviewResponse,
  SensorHistorySourceResponse,
} from '@/lib/sensor-history-types';
import { cn } from '@/lib/utils';

type OverviewState =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; data: SensorHistoryOverviewResponse };

type SourceState =
  | { phase: 'idle' }
  | { phase: 'error'; entityId: string; message: string }
  | { phase: 'ready'; entityId: string; data: SensorHistorySourceResponse };

const emptySources: ImportedSensorSummary[] = [];

function formatNumber(value: number, unit: string | null) {
  const digits =
    unit && /^(?:L|W|V|A|VA|MB|GB|%)$/i.test(unit)
      ? 0
      : unit && /^(?:kWh|Mbit\/s|MB\/s|°C|hPa|lx|L\/min)$/i.test(unit)
        ? 1
        : 2;
  const text = new Intl.NumberFormat('en-GB', {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(value);
  return unit ? `${text} ${unit}` : text;
}

function formatDate(value: string) {
  if (!value) return 'Not recorded';
  const input = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T12:00:00.000Z`
    : value;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function sourceContext(source: ImportedSensorSummary) {
  return [source.areaLabel, source.deviceLabel].filter(Boolean).join(' · ');
}

function groupedSources(sources: ImportedSensorSummary[]) {
  const groups = new Map<string, ImportedSensorSummary[]>();
  for (const source of sources) {
    const label =
      source.deviceLabel ?? source.areaLabel ?? 'Independent sources';
    const current = groups.get(label) ?? [];
    current.push(source);
    groups.set(label, current);
  }
  return [...groups.entries()].sort(([left], [right]) =>
    left.localeCompare(right),
  );
}

function isOverview(value: unknown): value is SensorHistoryOverviewResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    ((value as { status?: unknown }).status === 'available' ||
      (value as { status?: unknown }).status === 'not_imported') &&
    Array.isArray((value as { sources?: unknown }).sources) &&
    Array.isArray((value as { groups?: unknown }).groups)
  );
}

function isSourceHistory(value: unknown): value is SensorHistorySourceResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    ((value as { status?: unknown }).status === 'available' ||
      (value as { status?: unknown }).status === 'not_imported')
  );
}

function TapeForSource({
  source,
  days,
}: {
  source: ImportedSensorSummary;
  days: ImportedSensorDay[];
}) {
  const points: MeasuredTapePoint[] = days.map((day) => ({
    date: day.date,
    value: day.value,
    minimum: day.minimum,
    maximum: day.maximum,
  }));

  return (
    <MeasuredWeeklyTape
      subject={{
        id: source.entityId,
        name: source.label,
        unit: source.unit,
        aggregation: source.aggregation,
        points,
      }}
    />
  );
}

function SourceMetric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-xl border border-[#e0d8cb] bg-[#f7f3ec] px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8f7040]">
        {label}
      </p>
      <p className="mt-1 text-[1.1rem] font-semibold leading-none tracking-[-0.04em] tabular-nums text-[#153044]">
        {value}
      </p>
      <p className="mt-1.5 text-[10px] leading-4 text-[#6b777f]">{note}</p>
    </div>
  );
}

/**
 * Keeps the original Oriel utility/system hierarchy while replacing fixture
 * values with imported recorder summaries. Native system and source controls
 * stay directly above the selected reading, so no separate inspect action or
 * scrolling through a source list is required.
 */
export function ImportedSensorBreakdown({
  groupId,
  primaryEntityId,
  note,
  className,
  historyEndpoint = '/api/sensor-history',
  accessToken,
  selectedEntityId: controlledEntityId,
  onSelectEntityId,
}: {
  groupId: string;
  primaryEntityId?: string;
  note: string;
  className?: string;
  historyEndpoint?: string;
  accessToken?: string;
  selectedEntityId?: string;
  onSelectEntityId?: (entityId: string) => void;
}) {
  const [overview, setOverview] = useState<OverviewState>({ phase: 'loading' });
  const [localSelectedEntityId, setLocalSelectedEntityId] = useState<
    string | null
  >(null);
  const [history, setHistory] = useState<SourceState>({ phase: 'idle' });

  const loadOverview = useCallback(async () => {
    try {
      const response = await fetch(
        `${historyEndpoint}?group=${encodeURIComponent(groupId)}`,
        {
          cache: 'no-store',
          headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : undefined,
        },
      );
      const payload: unknown = await response.json();
      if (!response.ok || !isOverview(payload)) {
        throw new Error('Oriel could not read this sensor group.');
      }
      setOverview({ phase: 'ready', data: payload });
    } catch {
      setOverview({
        phase: 'error',
        message: 'The imported recorder summary could not be loaded.',
      });
    }
  }, [accessToken, groupId, historyEndpoint]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadOverview();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadOverview]);

  const sources = useMemo(
    () => (overview.phase === 'ready' ? overview.data.sources : emptySources),
    [overview],
  );
  const resolvedEntityId = useMemo(() => {
    const requestedEntityId = controlledEntityId ?? localSelectedEntityId;
    if (
      requestedEntityId &&
      sources.some((source) => source.entityId === requestedEntityId)
    ) {
      return requestedEntityId;
    }
    const primary = primaryEntityId
      ? sources.find((source) => source.entityId === primaryEntityId)
      : null;
    return (
      primary?.entityId ??
      sources.find((source) => source.pointCount > 0)?.entityId ??
      sources[0]?.entityId ??
      null
    );
  }, [controlledEntityId, localSelectedEntityId, primaryEntityId, sources]);

  useEffect(() => {
    if (!resolvedEntityId) return;
    let cancelled = false;
    void fetch(`${historyEndpoint}/${encodeURIComponent(resolvedEntityId)}`, {
      cache: 'no-store',
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined,
    })
      .then(async (response) => {
        const payload: unknown = await response.json();
        if (!response.ok || !isSourceHistory(payload)) {
          throw new Error('Oriel could not read this source.');
        }
        if (!cancelled) {
          setHistory({
            phase: 'ready',
            entityId: resolvedEntityId,
            data: payload,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHistory({
            phase: 'error',
            entityId: resolvedEntityId,
            message: 'The selected source history could not be loaded.',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, historyEndpoint, resolvedEntityId]);

  const selected = useMemo(
    () =>
      sources.find((source) => source.entityId === resolvedEntityId) ?? null,
    [resolvedEntityId, sources],
  );
  const grouped = useMemo(() => groupedSources(sources), [sources]);
  const summaryGroup =
    overview.phase === 'ready'
      ? overview.data.groups.find((group) => group.id === groupId)
      : null;

  if (overview.phase === 'loading') {
    return (
      <section className={cn('rounded-2xl bg-[#fcfbf8] px-4 py-4', className)}>
        <p className="text-[12px] text-[#6b777f]">
          Loading recorded sensor history…
        </p>
      </section>
    );
  }

  if (overview.phase === 'error') {
    return (
      <section className={cn('rounded-2xl bg-[#fdf8f5] px-4 py-4', className)}>
        <p className="text-[12px] text-[#8a4b3a]">{overview.message}</p>
        <Button
          variant="outline"
          className="mt-3 h-8 rounded-full border-[#cfc5b4] text-[12px]"
          onClick={() => void loadOverview()}
        >
          <RefreshCw className="mr-1.5 size-3" />
          Try again
        </Button>
      </section>
    );
  }

  if (overview.data.status === 'not_imported' || !sources.length) {
    return (
      <section className={cn('rounded-2xl bg-[#fcfbf8] px-4 py-4', className)}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
          Recorded sources
        </p>
        <p className="mt-1 text-[12px] leading-5 text-[#52626c]">
          {overview.data.detail}
        </p>
      </section>
    );
  }

  return (
    <section className={cn('space-y-4', className)}>
      <div className="rounded-2xl border border-[#e0d8cb] bg-[#fcfbf8] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
          Parameter
        </p>
        <p className="mt-1 text-[12px] leading-5 text-[#52626c]">{note}</p>
        <label
          htmlFor={`recorded-parameter-${groupId}`}
          className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6b777f]"
        >
          Choose a recorded parameter
        </label>
        <select
          id={`recorded-parameter-${groupId}`}
          value={resolvedEntityId ?? ''}
          onChange={(event) => {
            if (onSelectEntityId) {
              onSelectEntityId(event.target.value);
              return;
            }
            setLocalSelectedEntityId(event.target.value);
          }}
          className="mt-1.5 h-11 w-full appearance-auto rounded-xl border border-[#d8cdbd] bg-white px-3 text-[14px] font-medium text-[#153044] outline-none transition focus:border-[#a88348] focus:ring-2 focus:ring-[#a88348]/20"
        >
          {grouped.map(([label, entries]) => (
            <optgroup key={label} label={label}>
              {entries.map((source) => (
                <option key={source.entityId} value={source.entityId}>
                  {source.label}
                  {source.areaLabel ? ` · ${source.areaLabel}` : ''}
                  {source.isArchived ? ' · Archived' : ''}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <p className="mt-2 text-[10px] leading-4 text-[#6b777f]">
          {summaryGroup?.availableCount ?? 0} of{' '}
          {summaryGroup?.sourceCount ?? sources.length} sources have at least
          one complete daily record. The snapshot ends on 19 Sept 2026; this is
          historical data, not a live reading.
        </p>
      </div>

      {selected ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-1">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
                Selected source
              </p>
              <h2 className="mt-1 text-[17px] font-medium text-[#153044]">
                {selected.label}
              </h2>
              <p className="mt-0.5 text-[11px] text-[#6b777f]">
                {sourceContext(selected) || 'Historical source'}
                {selected.isArchived ? ' · Archived source' : ''}
              </p>
            </div>
            <p className="text-[10px] text-[#6b777f]">
              Through {formatDate(selected.dataThrough)}
            </p>
          </div>

          {history.phase === 'ready' &&
          history.entityId === resolvedEntityId &&
          history.data.source &&
          history.data.daily ? (
            <>
              <TapeForSource
                source={history.data.source}
                days={history.data.daily}
              />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <SourceMetric
                  label={
                    selected.aggregation === 'daily_total'
                      ? 'Last 7 days'
                      : '7-day average'
                  }
                  value={
                    selected.last7Days
                      ? formatNumber(selected.last7Days.value, selected.unit)
                      : formatNumber(0, selected.unit)
                  }
                  note={
                    selected.last7Days
                      ? `${formatDate(selected.last7Days.from)} – ${formatDate(selected.last7Days.to)}`
                      : 'No complete daily window'
                  }
                />
                <SourceMetric
                  label="Latest complete day"
                  value={
                    selected.latest
                      ? formatNumber(selected.latest.value, selected.unit)
                      : formatNumber(0, selected.unit)
                  }
                  note={
                    selected.latest
                      ? formatDate(selected.latest.day)
                      : 'Not available'
                  }
                />
                <SourceMetric
                  label="Coverage"
                  value={`${selected.pointCount} days`}
                  note={`${formatDate(selected.firstObservedAt)} – ${formatDate(selected.dataThrough)}`}
                />
              </div>
              {history.data.detail !==
              'Only complete, normalized daily observations are displayed.' ? (
                <p className="rounded-xl bg-[#f7f3ec] px-3 py-2 text-[11px] leading-4 text-[#6b777f]">
                  {history.data.detail}
                </p>
              ) : null}
            </>
          ) : history.phase === 'error' &&
            history.entityId === resolvedEntityId ? (
            <p className="rounded-xl bg-[#fdf8f5] px-3 py-2 text-[12px] text-[#8a4b3a]">
              {history.message}
            </p>
          ) : (
            <div className="rounded-2xl bg-[#102030] px-4 py-5 text-[12px] text-white/70">
              Loading complete daily history…
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
