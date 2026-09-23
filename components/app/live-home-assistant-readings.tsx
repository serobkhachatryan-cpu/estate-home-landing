'use client';

import { Radio, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import type {
  LiveSensorGroupId,
  LiveSensorSnapshotResponse,
} from '@/lib/live-sensor-types';
import { cn } from '@/lib/utils';

type LoadState =
  | { phase: 'loading' }
  | { phase: 'error' }
  | { phase: 'ready'; data: LiveSensorSnapshotResponse };

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

function isStale(value: string) {
  const observedAt = new Date(value).getTime();
  return (
    !Number.isFinite(observedAt) || Date.now() - observedAt > 10 * 60 * 1000
  );
}

function formatState(value: string) {
  const number = Number(value);
  if (!Number.isFinite(number)) return value;
  return new Intl.NumberFormat('en-GB', {
    maximumFractionDigits: 3,
  }).format(number);
}

/**
 * A small, separate live panel so a current Home Assistant state cannot be
 * mistaken for the normalized historical series and its recorded costs.
 */
export function LiveHomeAssistantReadings({
  groupId,
  entityId,
  endpoint = '/api/live-sensors',
  accessToken,
  compact = false,
}: {
  groupId: LiveSensorGroupId;
  entityId?: string;
  endpoint?: string;
  accessToken?: string;
  compact?: boolean;
}) {
  const [state, setState] = useState<LoadState>({ phase: 'loading' });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (manual = false) => {
      if (manual) setRefreshing(true);
      try {
        const parameters = new URLSearchParams({ group: groupId });
        if (entityId) parameters.set('entityId', entityId);
        const response = await fetch(
          `${endpoint}${endpoint.includes('?') ? '&' : '?'}${parameters.toString()}`,
          {
            cache: 'no-store',
            headers: accessToken
              ? { Authorization: `Bearer ${accessToken}` }
              : undefined,
          },
        );
        const payload: unknown = await response.json();
        if (!response.ok || !isSnapshot(payload))
          throw new Error('Unavailable');
        setState({ phase: 'ready', data: payload });
      } catch {
        setState({ phase: 'error' });
      } finally {
        if (manual) setRefreshing(false);
      }
    },
    [accessToken, endpoint, entityId, groupId],
  );

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(() => void load(), 60_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [load]);

  const observedAt = useMemo(() => {
    if (state.phase !== 'ready' || !state.data.readings.length) return null;
    return state.data.readings.reduce(
      (latest, reading) =>
        reading.observedAt > latest ? reading.observedAt : latest,
      state.data.readings[0]!.observedAt,
    );
  }, [state]);
  const stale = observedAt ? isStale(observedAt) : false;
  const isAvailable =
    state.phase === 'ready' && state.data.status === 'available' && !stale;
  const selectedReading =
    state.phase === 'ready' && state.data.readings.length === 1
      ? state.data.readings[0]
      : null;

  if (compact && selectedReading) {
    return (
      <section
        aria-live="polite"
        className="sticky top-3 z-20 rounded-2xl border border-[#a88348]/45 bg-[#153044] px-4 py-3 text-white shadow-[0_12px_28px_rgba(16,32,48,0.24)]"
      >
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Radio className="size-3.5 text-[#eac789]" strokeWidth={2} />
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#eac789]">
                Live now · Home Assistant
              </p>
            </div>
            <p className="mt-1 truncate text-[11px] text-white/65">
              {selectedReading.label}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[1.55rem] font-semibold leading-none tracking-[-0.05em] tabular-nums text-white">
              {formatState(selectedReading.state)}
              {selectedReading.unit ? (
                <span className="ml-1 text-[0.9rem] font-medium tracking-normal text-white/65">
                  {selectedReading.unit}
                </span>
              ) : null}
            </p>
            <p className="mt-1 text-[9px] text-white/55">
              HA updated {formatTime(selectedReading.stateUpdatedAt)}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-live="polite"
      className="overflow-hidden rounded-2xl border border-[#d4cdbf] bg-[#fcfbf8]"
    >
      <header className="flex items-start justify-between gap-3 px-4 pb-3 pt-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Radio
              className={cn(
                'size-4 text-[#8f7040]',
                isAvailable && 'text-[#557154]',
              )}
              strokeWidth={1.8}
            />
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
              Live now · Home Assistant
            </p>
          </div>
          <p className="mt-1 text-[12px] leading-5 text-[#52626c]">
            {state.phase === 'loading'
              ? 'Checking the local read-only bridge…'
              : state.phase === 'error'
                ? 'Oriel could not load the current state right now.'
                : stale && observedAt
                  ? `Last received ${formatTime(observedAt)}. The bridge is not currently live.`
                  : state.data.detail}
          </p>
        </div>
        <Button
          variant="ghost"
          className="h-8 shrink-0 rounded-full px-2.5 text-[11px] text-[#815f2c] hover:bg-[#efe7da] hover:text-[#5b421b]"
          onClick={() => void load(true)}
          disabled={refreshing}
        >
          <RefreshCw
            className={cn('mr-1.5 size-3.5', refreshing && 'animate-spin')}
          />
          Refresh
        </Button>
      </header>

      {state.phase === 'ready' && state.data.readings.length ? (
        <div className="border-t border-[#e8e1d7] bg-[#f7f3ec] px-4 py-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {state.data.readings.map((reading) => (
              <article
                key={reading.entityId}
                className="rounded-xl border border-[#e0d8cb] bg-[#fcfbf8] px-3 py-2.5"
              >
                <p className="truncate text-[11px] font-medium text-[#52626c]">
                  {reading.label}
                </p>
                <p className="mt-1 text-[1.25rem] font-semibold leading-none tracking-[-0.04em] tabular-nums text-[#153044]">
                  {formatState(reading.state)}
                  {reading.unit ? (
                    <span className="ml-1 text-[0.8rem] font-medium tracking-normal text-[#52626c]">
                      {reading.unit}
                    </span>
                  ) : null}
                </p>
                <p className="mt-1.5 truncate text-[9px] text-[#6b777f]">
                  Home Assistant updated {formatTime(reading.stateUpdatedAt)}
                </p>
              </article>
            ))}
          </div>
          {observedAt ? (
            <p className="mt-2 text-[10px] leading-4 text-[#6b777f]">
              {stale ? 'Last bridge sync' : 'Bridge sync'}{' '}
              {formatTime(observedAt)} · read-only sensor states
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
