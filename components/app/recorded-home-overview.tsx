'use client';

import { ArrowRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AppLink } from '@/components/app/app-link';
import {
  MeasuredWeeklyTape,
  type MeasuredTapePoint,
} from '@/components/app/spend-weekly-tape';
import type {
  ImportedSensorSummary,
  SensorHistoryOverviewResponse,
  SensorHistorySourceResponse,
} from '@/lib/sensor-history-types';

type LoadState =
  | { phase: 'loading' }
  | { phase: 'error' }
  | { phase: 'ready'; data: SensorHistoryOverviewResponse };

const groupLinks: Record<string, string> = {
  power: '/app/electricity',
  water: '/app/water',
  fuel: '/app/systems',
  climate: '/app/systems',
  security: '/app/systems',
  network: '/app/systems',
  care: '/app/care',
  sensors: '/app/systems',
};

function isOverview(value: unknown): value is SensorHistoryOverviewResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { status?: unknown }).status === 'available' &&
    Array.isArray((value as { sources?: unknown }).sources) &&
    Array.isArray((value as { groups?: unknown }).groups)
  );
}

function isSource(value: unknown): value is SensorHistorySourceResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { status?: unknown }).status === 'available'
  );
}

function primaryPowerSource(sources: ImportedSensorSummary[]) {
  return (
    sources.find(
      (source) => source.entityId === 'sensor.shellypro3em_9454c5b9da04_energy',
    ) ?? sources.find((source) => source.groupId === 'power' && source.pointCount > 0)
  );
}

/** Original home dashboard, changed from sample spend to recorded facts. */
export function RecordedHomeOverview() {
  const [overview, setOverview] = useState<LoadState>({ phase: 'loading' });
  const [history, setHistory] = useState<SensorHistorySourceResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/sensor-history', { cache: 'no-store' })
      .then(async (response) => {
        const payload: unknown = await response.json();
        if (!response.ok || !isOverview(payload)) throw new Error('Unavailable');
        if (!cancelled) setOverview({ phase: 'ready', data: payload });
      })
      .catch(() => {
        if (!cancelled) setOverview({ phase: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const primary = useMemo(
    () => (overview.phase === 'ready' ? primaryPowerSource(overview.data.sources) : undefined),
    [overview],
  );

  useEffect(() => {
    if (!primary) {
      return;
    }
    let cancelled = false;
    void fetch(`/api/sensor-history/${encodeURIComponent(primary.entityId)}`, {
      cache: 'no-store',
    })
      .then(async (response) => {
        const payload: unknown = await response.json();
        if (!response.ok || !isSource(payload)) throw new Error('Unavailable');
        if (!cancelled) setHistory(payload);
      })
      .catch(() => {
        if (!cancelled) setHistory(null);
      });
    return () => {
      cancelled = true;
    };
  }, [primary]);

  if (overview.phase === 'loading') {
    return <p className="text-[13px] text-[#6b777f]">Loading recorded home history…</p>;
  }

  if (overview.phase === 'error') {
    return (
      <p className="rounded-2xl bg-[#fdf8f5] px-4 py-3 text-[13px] text-[#8a4b3a]">
        Oriel could not load the local recorder summary.
      </p>
    );
  }

  const groups = overview.data.groups;
  const points: MeasuredTapePoint[] = (history?.daily ?? []).map((day) => ({
    date: day.date,
    value: day.value,
    minimum: day.minimum,
    maximum: day.maximum,
  }));

  return (
    <div className="space-y-5">
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
          Recorded home operation
        </p>
        <p className="mt-1 text-[13px] leading-5 text-[#6b777f]">
          Historical Home Assistant statistics through 19 Sept 2026. Physical
          readings are shown as measurements; they are not invoices, forecasts
          or live telemetry.
        </p>
      </section>

      {primary && points.length ? (
        <MeasuredWeeklyTape
          subject={{
            id: primary.entityId,
            name: primary.label,
            unit: primary.unit,
            aggregation: primary.aggregation,
            points,
          }}
        />
      ) : (
        <div className="rounded-2xl bg-[#102030] px-4 py-5 text-[13px] text-white/70">
          0 kWh · no complete primary electricity series is available yet.
        </div>
      )}

      <section>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
          System breakdowns
        </p>
        <div className="space-y-2">
          {groups.map((group) => (
            <AppLink
              key={group.id}
              href={groupLinks[group.id] ?? '/app/systems'}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[#e0d8cb] bg-[#fcfbf8] px-4 py-3"
            >
              <span className="min-w-0">
                <span className="block text-[14px] font-medium text-[#153044]">
                  {group.label}
                </span>
                <span className="mt-0.5 block text-[11px] text-[#6b777f]">
                  {group.availableCount} / {group.sourceCount} sources with complete daily history
                </span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-[#815f2c]" />
            </AppLink>
          ))}
        </div>
      </section>
    </div>
  );
}
