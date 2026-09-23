'use client';

import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { LiveHomeAssistantReadings } from '@/components/app/live-home-assistant-readings';
import {
  MeasuredWeeklyTape,
  type MeasuredTapeCost,
  type MeasuredTapePoint,
} from '@/components/app/spend-weekly-tape';
import { Button } from '@/components/ui/button';
import type { LiveSensorGroupId } from '@/lib/live-sensor-types';
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

type RelatedCostState = {
  requestKey: string;
  cost: MeasuredTapeCost;
};

const emptySources: ImportedSensorSummary[] = [];

function isPoundSterling(unit: string | null) {
  return unit?.trim().toUpperCase() === 'GBP';
}

function formatPounds(value: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number, unit: string | null) {
  if (isPoundSterling(unit)) return formatPounds(value);
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

function costIdentity(source: ImportedSensorSummary) {
  if (
    !isPoundSterling(source.unit) &&
    source.unitClass?.trim().toLowerCase() !== 'monetary'
  ) {
    return null;
  }
  const match = source.entityId.match(
    /^sensor\.shellypro3em_([a-f0-9]+)(?:_phase_([abc]))?_energy_cost$/i,
  );
  if (!match) {
    return { label: 'Recorded cost', context: 'Recorded currency source' };
  }
  const meter = match[1].slice(-4).toUpperCase();
  const phase = match[2]?.toUpperCase();
  return {
    label: phase ? `Energy cost · phase ${phase}` : 'Energy cost · meter total',
    context: `Shelly meter ${meter}`,
  };
}

type ShellyMeterIdentity = {
  meter: string;
  phase: 'A' | 'B' | 'C' | null;
};

function shellyEnergyIdentity(entityId: string): ShellyMeterIdentity | null {
  const match = entityId.match(
    /^sensor\.shellypro3em_([a-f0-9]+)(?:_phase_([abc]))?_energy$/i,
  );
  if (!match) return null;
  const phase = match[2]?.toUpperCase();
  return {
    meter: match[1].toLowerCase(),
    phase: phase === 'A' || phase === 'B' || phase === 'C' ? phase : null,
  };
}

function shellyCostIdentity(entityId: string): ShellyMeterIdentity | null {
  const match = entityId.match(
    /^sensor\.shellypro3em_([a-f0-9]+)(?:_phase_([abc]))?_energy_cost$/i,
  );
  if (!match) return null;
  const phase = match[2]?.toUpperCase();
  return {
    meter: match[1].toLowerCase(),
    phase: phase === 'A' || phase === 'B' || phase === 'C' ? phase : null,
  };
}

type RelatedCostSources = {
  costSources: ImportedSensorSummary[];
  phaseEnergySources: ImportedSensorSummary[];
  detail: string;
};

type MeterSource = {
  source: ImportedSensorSummary;
  identity: ShellyMeterIdentity;
};

function isRecordedCostSource(source: ImportedSensorSummary) {
  return (
    isPoundSterling(source.unit) &&
    source.aggregation === 'daily_total' &&
    source.quality === 'available' &&
    source.pointCount > 0
  );
}

function isRecordedEnergySource(source: ImportedSensorSummary) {
  return (
    source.aggregation === 'daily_total' &&
    source.quality === 'available' &&
    source.pointCount > 0 &&
    (source.unitClass?.trim().toLowerCase() === 'energy' ||
      source.unit?.trim().toLowerCase() === 'kwh')
  );
}

function costSourcesForEnergy(
  source: ImportedSensorSummary | null,
  sources: ImportedSensorSummary[],
): RelatedCostSources | null {
  if (!source || costIdentity(source)) return null;
  const energy = shellyEnergyIdentity(source.entityId);
  if (!energy || !isRecordedEnergySource(source)) return null;

  const matching: MeterSource[] = [];
  for (const candidate of sources) {
    const identity = shellyCostIdentity(candidate.entityId);
    if (identity?.meter === energy.meter && isRecordedCostSource(candidate)) {
      matching.push({ source: candidate, identity });
    }
  }

  if (energy.phase) {
    const phase = matching.find(
      (candidate) => candidate.identity.phase === energy.phase,
    );
    return phase
      ? {
          costSources: [phase.source],
          phaseEnergySources: [],
          detail: `Phase ${energy.phase}`,
        }
      : null;
  }

  const meterTotal = matching.find(
    (candidate) => candidate.identity.phase === null,
  );
  if (meterTotal) {
    return {
      costSources: [meterTotal.source],
      phaseEnergySources: [],
      detail: 'Matched meter',
    };
  }

  const phaseNames = ['A', 'B', 'C'] as const;
  const costSources: ImportedSensorSummary[] = [];
  const phaseEnergySources: ImportedSensorSummary[] = [];
  for (const phase of phaseNames) {
    const matchingCost = matching.find(
      (candidate) => candidate.identity.phase === phase,
    );
    const matchingEnergy = sources.find((candidate) => {
      const identity = shellyEnergyIdentity(candidate.entityId);
      return (
        identity?.meter === energy.meter &&
        identity.phase === phase &&
        isRecordedEnergySource(candidate)
      );
    });
    if (!matchingCost || !matchingEnergy) return null;
    costSources.push(matchingCost.source);
    phaseEnergySources.push(matchingEnergy);
  }

  return {
    costSources,
    phaseEnergySources,
    detail: 'Phase A + B + C',
  };
}

function completeDailyTotals(daysBySource: ImportedSensorDay[][]) {
  if (!daysBySource.length) return new Map<string, number>();
  const daily = new Map<string, { count: number; value: number }>();
  for (const days of daysBySource) {
    const seen = new Set<string>();
    for (const day of days) {
      if (seen.has(day.date) || !Number.isFinite(day.value)) continue;
      seen.add(day.date);
      const current = daily.get(day.date) ?? { count: 0, value: 0 };
      current.count += 1;
      current.value += day.value;
      daily.set(day.date, current);
    }
  }
  return new Map(
    [...daily.entries()]
      .filter(([, value]) => value.count === daysBySource.length)
      .map(([date, value]) => [
        date,
        Math.round((value.value + Number.EPSILON) * 1000) / 1000,
      ]),
  );
}

function matchedCostPoints(
  costDaysBySource: ImportedSensorDay[][],
  selectedEnergyDays: ImportedSensorDay[],
  phaseEnergyDaysBySource: ImportedSensorDay[][],
) {
  const costsByDate = completeDailyTotals(costDaysBySource);
  const selectedEnergyByDate = new Map(
    selectedEnergyDays
      .filter((day) => Number.isFinite(day.value))
      .map((day) => [day.date, day.value]),
  );
  const phaseEnergyByDate = phaseEnergyDaysBySource.length
    ? completeDailyTotals(phaseEnergyDaysBySource)
    : null;

  return [...costsByDate.entries()]
    .filter(([date]) => {
      const selectedEnergy = selectedEnergyByDate.get(date);
      if (selectedEnergy == null) return false;
      if (!phaseEnergyByDate) return true;
      const phaseEnergy = phaseEnergyByDate.get(date);
      return (
        phaseEnergy != null && Math.abs(phaseEnergy - selectedEnergy) <= 0.01
      );
    })
    .map(([date, value]) => ({
      date,
      value,
      minimum: null,
      maximum: null,
      sampleCount: 0,
    }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

function displaySourceLabel(source: ImportedSensorSummary) {
  return costIdentity(source)?.label ?? source.label;
}

function sourceContext(source: ImportedSensorSummary) {
  const location = [source.areaLabel, source.deviceLabel]
    .filter(Boolean)
    .join(' · ');
  return location || costIdentity(source)?.context || '';
}

function groupedSources(sources: ImportedSensorSummary[]) {
  const groups = new Map<string, ImportedSensorSummary[]>();
  for (const source of sources) {
    const label = costIdentity(source)
      ? 'Recorded energy cost'
      : (source.deviceLabel ?? source.areaLabel ?? 'Independent sources');
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
  cost,
}: {
  source: ImportedSensorSummary;
  days: ImportedSensorDay[];
  cost?: MeasuredTapeCost;
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
        name: displaySourceLabel(source),
        unit: source.unit,
        aggregation: source.aggregation,
        points,
      }}
      cost={cost}
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

function SourceButton({
  source,
  selected,
  onSelect,
}: {
  source: ImportedSensorSummary;
  selected: boolean;
  onSelect: () => void;
}) {
  const primary = source.last7Days ?? source.latest;
  const displayedLabel = displaySourceLabel(source);
  const label =
    source.aggregation === 'daily_total'
      ? source.last7Days
        ? 'Last 7d'
        : 'Latest'
      : source.last7Days
        ? '7d avg'
        : 'Latest';

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-label={`Select ${displayedLabel}`}
        aria-pressed={selected}
        className={cn(
          'flex w-full items-center justify-between gap-3 border-b border-[#eee8de] px-3 py-3 text-left last:border-0',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#a88348]/50',
          selected ? 'bg-[#f7f1e0]' : 'bg-[#fcfbf8] hover:bg-[#faf7f1]',
        )}
      >
        <span className="min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-medium text-[#153044]">
              {displayedLabel}
            </span>
            {costIdentity(source) ? (
              <span className="rounded-full bg-[#e7efe3] px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-[#2f4a34]">
                Recorded cost
              </span>
            ) : null}
            {source.isArchived ? (
              <span className="rounded-full bg-[#f0ebe3] px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-[#5a6270]">
                Archived
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 block truncate text-[10px] text-[#6b777f]">
            {sourceContext(source) || 'Historical source'}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-[12px] font-semibold tabular-nums text-[#153044]">
            {primary
              ? formatNumber(primary.value, source.unit)
              : formatNumber(0, source.unit)}
          </span>
          <span className="mt-0.5 block text-[9px] text-[#6b777f]">
            {primary ? label : 'No complete record'}
          </span>
        </span>
      </button>
    </li>
  );
}

/**
 * Keeps the original Oriel utility/system hierarchy while replacing fixture
 * values with imported recorder summaries. Callers can choose whether a
 * compact selector appears before the reading or expanded source groups below.
 */
export function ImportedSensorBreakdown({
  groupId,
  primaryEntityId,
  note,
  className,
  historyEndpoint = '/api/sensor-history',
  accessToken,
  liveEndpoint = '/api/live-sensors',
  liveAccessToken,
  selectedEntityId: controlledEntityId,
  onSelectEntityId,
  parameterPlacement = 'before-reading',
}: {
  groupId: string;
  primaryEntityId?: string;
  note: string;
  className?: string;
  historyEndpoint?: string;
  accessToken?: string;
  liveEndpoint?: string;
  liveAccessToken?: string;
  selectedEntityId?: string;
  onSelectEntityId?: (entityId: string) => void;
  parameterPlacement?: 'before-reading' | 'after-reading';
}) {
  const [overview, setOverview] = useState<OverviewState>({ phase: 'loading' });
  const [localSelectedEntityId, setLocalSelectedEntityId] = useState<
    string | null
  >(null);
  const [history, setHistory] = useState<SourceState>({ phase: 'idle' });
  const [relatedCostHistory, setRelatedCostHistory] =
    useState<RelatedCostState | null>(null);

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
  const selected = useMemo(
    () =>
      sources.find((source) => source.entityId === resolvedEntityId) ?? null,
    [resolvedEntityId, sources],
  );
  const relatedCostSources = useMemo(
    () => costSourcesForEnergy(selected, sources),
    [selected, sources],
  );

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

  const selectedDaily =
    history.phase === 'ready' &&
    history.entityId === resolvedEntityId &&
    history.data.status === 'available' &&
    history.data.daily
      ? history.data.daily
      : null;
  const costRequestKey =
    resolvedEntityId && relatedCostSources && selectedDaily
      ? [
          resolvedEntityId,
          ...relatedCostSources.costSources.map((source) => source.entityId),
          ...relatedCostSources.phaseEnergySources.map(
            (source) => source.entityId,
          ),
        ].join('|')
      : null;

  useEffect(() => {
    if (!relatedCostSources || !selectedDaily || !costRequestKey) return;

    let cancelled = false;
    const loadDaily = async (source: ImportedSensorSummary) => {
      const response = await fetch(
        `${historyEndpoint}/${encodeURIComponent(source.entityId)}`,
        {
          cache: 'no-store',
          headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : undefined,
        },
      );
      const payload: unknown = await response.json();
      if (
        !response.ok ||
        !isSourceHistory(payload) ||
        payload.status !== 'available' ||
        !payload.daily
      ) {
        throw new Error('Related cost history is unavailable.');
      }
      return payload.daily;
    };

    void Promise.all(
      [
        ...relatedCostSources.costSources,
        ...relatedCostSources.phaseEnergySources,
      ].map(loadDaily),
    )
      .then((allDays) => {
        const costSourceCount = relatedCostSources.costSources.length;
        const points = matchedCostPoints(
          allDays.slice(0, costSourceCount),
          selectedDaily,
          allDays.slice(costSourceCount),
        );
        if (!points.length) return;
        if (!cancelled) {
          setRelatedCostHistory({
            requestKey: costRequestKey,
            cost: {
              label: 'Recorded cost',
              detail: relatedCostSources.detail,
              points,
            },
          });
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [
    accessToken,
    costRequestKey,
    historyEndpoint,
    relatedCostSources,
    selectedDaily,
  ]);

  const relatedCost =
    relatedCostHistory?.requestKey === costRequestKey
      ? relatedCostHistory.cost
      : undefined;
  const grouped = useMemo(() => groupedSources(sources), [sources]);
  const summaryGroup =
    overview.phase === 'ready'
      ? overview.data.groups.find((group) => group.id === groupId)
      : null;
  const selectSource = useCallback(
    (entityId: string) => {
      if (onSelectEntityId) {
        onSelectEntityId(entityId);
        return;
      }
      setLocalSelectedEntityId(entityId);
    },
    [onSelectEntityId],
  );

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
      {parameterPlacement === 'before-reading' ? (
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
            onChange={(event) => selectSource(event.target.value)}
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
            one complete daily record. The snapshot ends on 19 Sept 2026; this
            is historical data, not a live reading.
          </p>
        </div>
      ) : null}

      {selected ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-1">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
                Selected parameter
              </p>
              <h2
                aria-live="polite"
                className="mt-1 text-[17px] font-medium text-[#153044]"
              >
                {displaySourceLabel(selected)}
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

          <LiveHomeAssistantReadings
            groupId={selected.groupId as LiveSensorGroupId}
            entityId={selected.entityId}
            endpoint={liveEndpoint}
            accessToken={liveAccessToken ?? accessToken}
            compact
          />

          {history.phase === 'ready' &&
          history.entityId === resolvedEntityId &&
          history.data.source &&
          history.data.daily ? (
            <>
              <TapeForSource
                source={history.data.source}
                days={history.data.daily}
                cost={relatedCost}
              />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <SourceMetric
                  label={
                    costIdentity(selected)
                      ? 'Cost · last 7 days'
                      : selected.aggregation === 'daily_total'
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
                  label={
                    costIdentity(selected)
                      ? 'Cost · latest day'
                      : 'Latest complete day'
                  }
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
              {costIdentity(selected) ? (
                <p className="rounded-xl bg-[#f7f3ec] px-3 py-2 text-[11px] leading-4 text-[#6b777f]">
                  Recorded cost for this individual meter or phase. It is not an
                  invoice, a property-ledger record, or a combined estate total.
                </p>
              ) : null}
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

      {parameterPlacement === 'after-reading' ? (
        <div>
          <div className="mb-2 px-1">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
              Parameters · {sources.length}
            </h2>
            <p className="mt-1 text-[12px] leading-5 text-[#52626c]">{note}</p>
            <p className="mt-1 text-[10px] leading-4 text-[#6b777f]">
              {summaryGroup?.availableCount ?? 0} of{' '}
              {summaryGroup?.sourceCount ?? sources.length} sources have at
              least one complete daily record. The snapshot ends on 19 Sept
              2026; this is historical data, not a live reading.
            </p>
          </div>
          <div className="space-y-3">
            {grouped.map(([label, entries]) => (
              <section
                key={label}
                aria-label={`${label} parameters`}
                className="overflow-hidden rounded-2xl border border-[#e0d8cb] bg-[#fcfbf8]"
              >
                <header className="flex items-center justify-between gap-3 border-b border-[#e0d8cb] px-3 py-3">
                  <h3 className="min-w-0 truncate text-[13px] font-medium text-[#153044]">
                    {label}
                  </h3>
                  <span className="shrink-0 text-[10px] text-[#6b777f]">
                    {entries.length} parameter{entries.length === 1 ? '' : 's'}
                  </span>
                </header>
                <ul>
                  {entries.map((source) => (
                    <SourceButton
                      key={source.entityId}
                      source={source}
                      selected={source.entityId === resolvedEntityId}
                      onSelect={() => selectSource(source.entityId)}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
