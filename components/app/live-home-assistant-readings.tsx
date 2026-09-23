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

/**
 * A small, separate live panel so a current Home Assistant state cannot be
 * mistaken for the normalized historical series and its recorded costs.
 */
export function LiveHomeAssistantReadings({
  groupId,
  endpoint = '/api/live-sensors',
  accessToken,
}: {
  groupId: LiveSensorGroupId;
  endpoint?: string;
  accessToken?: string;
}) {
  const [state, setState] = useState<LoadState>({ phase: 'loading' });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (manual = false) => {
      if (manual) setRefreshing(true);
      try {
        const separator = endpoint.includes('?') ? '&' : '?';
        const response = await fetch(
          `${endpoint}${separator}group=${encodeURIComponent(groupId)}`,
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
    [accessToken, endpoint, groupId],
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
              Live Home Assistant
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
                  {reading.state}
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
