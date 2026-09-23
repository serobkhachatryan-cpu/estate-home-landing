'use client';

import { Radio, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  type LiveSensorGroupId,
  type LiveSensorReading,
  type LiveSensorSnapshotResponse,
} from '@/lib/live-sensor-types';
import { cn } from '@/lib/utils';

type LoadState =
  | { phase: 'loading' }
  | { phase: 'error' }
  | { phase: 'ready'; data: LiveSensorSnapshotResponse };

const displayOrder: LiveSensorGroupId[] = [
  'power',
  'water',
  'fuel',
  'climate',
  'security',
  'network',
  'care',
  'sensors',
];

const groupLabels: Record<LiveSensorGroupId, string> = {
  power: 'Power',
  water: 'Water',
  fuel: 'Fuel',
  climate: 'Climate',
  security: 'Security',
  network: 'Network',
  care: 'Care',
  sensors: 'Sensors',
};

function isSnapshot(value: unknown): value is LiveSensorSnapshotResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    ((value as { status?: unknown }).status === 'available' ||
      (value as { status?: unknown }).status === 'not_configured') &&
    Array.isArray((value as { readings?: unknown }).readings) &&
    typeof (value as { detail?: unknown }).detail === 'string'
  );
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'time unavailable';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatState(value: string) {
  const number = Number(value);
  if (!Number.isFinite(number)) return value;
  return new Intl.NumberFormat('en-GB', {
    maximumFractionDigits: 3,
  }).format(number);
}

function isStale(value: string) {
  const observedAt = new Date(value).getTime();
  return (
    !Number.isFinite(observedAt) || Date.now() - observedAt > 10 * 60 * 1000
  );
}

function latestObservedAt(readings: LiveSensorReading[]) {
  return readings.reduce<string | null>(
    (latest, reading) =>
      !latest || reading.observedAt > latest ? reading.observedAt : latest,
    null,
  );
}

/**
 * The investor landing view of the allowlisted Home Assistant snapshot. It is
 * intentionally separate from recorder charts: a current state is useful to
 * inspect, but must never be presented as a verified day or weekly total.
 */
export function InvestorLiveTelemetry({
  endpoint,
  accessToken,
}: {
  endpoint: string;
  accessToken: string;
}) {
  const [state, setState] = useState<LoadState>({ phase: 'loading' });
  const [selectedGroupId, setSelectedGroupId] =
    useState<LiveSensorGroupId>('power');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (manual = false) => {
      if (manual) setRefreshing(true);
      try {
        const response = await fetch(endpoint, {
          cache: 'no-store',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const payload: unknown = await response.json();
        if (!response.ok || !isSnapshot(payload)) throw new Error('Unavailable');
        setState({ phase: 'ready', data: payload });
      } catch {
        setState({ phase: 'error' });
      } finally {
        if (manual) setRefreshing(false);
      }
    },
    [accessToken, endpoint],
  );

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(() => void load(), 60_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [load]);

  const readings = state.phase === 'ready' ? state.data.readings : [];
  const groups = useMemo(
    () =>
      displayOrder.filter((groupId) =>
        readings.some((reading) => reading.groupId === groupId),
      ),
    [readings],
  );
  const activeGroup = groups.includes(selectedGroupId)
    ? selectedGroupId
    : (groups[0] ?? 'power');
  const activeReadings = readings.filter(
    (reading) => reading.groupId === activeGroup,
  );
  const observedAt = latestObservedAt(readings);
  const stale = observedAt ? isStale(observedAt) : true;

  if (state.phase === 'loading') {
    return (
      <section className="rounded-2xl border border-[#e0d8cb] bg-[#fcfbf8] px-4 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
          Live Home Assistant telemetry
        </p>
        <p className="mt-1.5 text-[13px] text-[#52626c]">
          Loading the latest read-only sensor snapshot…
        </p>
      </section>
    );
  }

  if (state.phase === 'error') {
    return (
      <section className="rounded-2xl border border-[#e0d8cb] bg-[#fcfbf8] px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
              Live Home Assistant telemetry
            </p>
            <p className="mt-1.5 text-[13px] leading-5 text-[#52626c]">
              The latest sensor snapshot could not be loaded right now.
            </p>
          </div>
          <Button
            variant="outline"
            className="h-8 shrink-0 rounded-full border-[#d8cdbd] px-3 text-[11px] text-[#815f2c]"
            onClick={() => void load(true)}
            disabled={refreshing}
          >
            <RefreshCw className={cn('mr-1.5 size-3.5', refreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </section>
    );
  }

  if (state.data.status !== 'available' || !readings.length) return null;

  return (
    <section
      aria-live="polite"
      className="overflow-hidden rounded-2xl border border-[#b89355]/60 bg-[#10283a] text-white shadow-[0_12px_28px_rgba(16,32,48,0.18)]"
    >
      <header className="flex items-start justify-between gap-3 border-b border-white/15 px-4 pb-3 pt-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio
              className={cn('size-4 text-[#eac789]', !stale && 'text-[#a9d3a5]')}
              strokeWidth={1.8}
            />
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#eac789]">
              Live Home Assistant telemetry
            </p>
          </div>
          <p className="mt-1.5 text-[12px] leading-5 text-white/68">
            {stale
              ? `Last received ${observedAt ? formatTime(observedAt) : 'at an unknown time'}. New readings have not arrived in the last 10 minutes.`
              : `Current sensor states · received ${observedAt ? formatTime(observedAt) : 'now'}`}
          </p>
        </div>
        <Button
          variant="ghost"
          className="h-8 shrink-0 rounded-full px-2.5 text-[11px] text-[#f2d6a3] hover:bg-white/10 hover:text-white"
          onClick={() => void load(true)}
          disabled={refreshing}
        >
          <RefreshCw className={cn('mr-1.5 size-3.5', refreshing && 'animate-spin')} />
          Refresh
        </Button>
      </header>

      <div className="border-b border-white/15 px-3 py-2.5">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {groups.map((groupId) => {
            const count = readings.filter(
              (reading) => reading.groupId === groupId,
            ).length;
            const selected = activeGroup === groupId;
            return (
              <button
                key={groupId}
                type="button"
                onClick={() => setSelectedGroupId(groupId)}
                aria-pressed={selected}
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eac789]',
                  selected
                    ? 'border-[#eac789] bg-[#eac789] text-[#10283a]'
                    : 'border-white/20 bg-white/[0.06] text-white/75 hover:bg-white/[0.12]',
                )}
              >
                {groupLabels[groupId]}{' '}
                <span className="opacity-65">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="divide-y divide-white/10">
        {activeReadings.map((reading) => (
          <article
            key={reading.entityId}
            className="flex items-center justify-between gap-4 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-white">
                {reading.label}
              </p>
              <p className="mt-0.5 text-[10px] text-white/55">
                Home Assistant updated {formatTime(reading.stateUpdatedAt)}
              </p>
            </div>
            <p className="shrink-0 text-right text-[1.15rem] font-semibold leading-none tracking-[-0.04em] tabular-nums text-white">
              {formatState(reading.state)}
              {reading.unit ? (
                <span className="ml-1 text-[0.78rem] font-medium tracking-normal text-white/60">
                  {reading.unit}
                </span>
              ) : null}
            </p>
          </article>
        ))}
      </div>

      <p className="border-t border-white/15 px-4 py-3 text-[10px] leading-4 text-white/52">
        These are current read-only states. They are not substituted into the
        verified historical charts or recorded costs below.
      </p>
    </section>
  );
}
