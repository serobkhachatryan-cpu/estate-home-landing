'use client';

import { RefreshCw, Radio } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { AppLink } from '@/components/app/app-link';
import { StatusBadge } from '@/components/app/status-badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type UtilityKind = 'electricity' | 'water';

type UtilityState = {
  status:
    | 'connected'
    | 'not_configured'
    | 'unreachable'
    | 'unauthorized'
    | 'entity_not_found'
    | 'invalid_response';
  utility: UtilityKind;
  entityId: string | null;
  value: string | null;
  unit: string | null;
  label: string | null;
  lastChanged: string | null;
  detail: string;
};

const statusCopy: Record<
  Exclude<UtilityState['status'], 'connected'>,
  { badge: string; state: 'offline' | 'watch'; action: string }
> = {
  not_configured: {
    badge: 'Setup needed',
    state: 'offline',
    action: 'Set up in Settings',
  },
  unreachable: {
    badge: 'Unavailable',
    state: 'offline',
    action: 'Try again',
  },
  unauthorized: {
    badge: 'Access needed',
    state: 'watch',
    action: 'Review setup',
  },
  entity_not_found: {
    badge: 'Sensor missing',
    state: 'watch',
    action: 'Review setup',
  },
  invalid_response: {
    badge: 'Needs review',
    state: 'watch',
    action: 'Try again',
  },
};

function lastUpdated(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export function HomeAssistantUtilityStatus({
  utility,
}: {
  utility: UtilityKind;
}) {
  const [reading, setReading] = useState<UtilityState | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/home-assistant/utility/${utility}`, {
        cache: 'no-store',
        credentials: 'same-origin',
      });
      if (!response.ok) throw new Error('Could not load Home Assistant.');
      setReading((await response.json()) as UtilityState);
    } catch {
      setReading({
        status: 'unreachable',
        utility,
        entityId: null,
        value: null,
        unit: null,
        label: null,
        lastChanged: null,
        detail: 'Oriel could not load this Home Assistant utility right now.',
      });
    } finally {
      setLoading(false);
    }
  }, [utility]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isConnected = reading?.status === 'connected';
  const isLocalTestSensor =
    isConnected && Boolean(reading?.entityId?.startsWith('sensor.oriel_demo_'));
  const issue =
    reading && reading.status !== 'connected'
      ? statusCopy[reading.status]
      : null;
  const updated = lastUpdated(reading?.lastChanged ?? null);

  return (
    <section
      aria-live="polite"
      className="mb-4 overflow-hidden rounded-2xl border border-[#d4cdbf] bg-[#fcfbf8]"
    >
      <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Radio className="size-4 text-[#8f7040]" strokeWidth={1.8} />
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
              {isLocalTestSensor
                ? 'Home Assistant connection check'
                : 'Home Assistant unit'}
            </p>
          </div>
          <p className="mt-1 text-[13px] text-[#52626c]">
            {loading
              ? 'Reading the selected utility sensor…'
              : isLocalTestSensor
                ? 'This local test sensor confirms the connection. It is not the imported property meter history above.'
                : reading?.detail}
          </p>
        </div>
        {isConnected ? (
          <StatusBadge
            state={isLocalTestSensor ? 'watch' : 'normal'}
            label={isLocalTestSensor ? 'Test data' : 'Live'}
          />
        ) : issue ? (
          <StatusBadge state={issue.state} label={issue.badge} />
        ) : null}
      </div>

      {isConnected ? (
        <div className="border-t border-[#e8e1d7] bg-[#f7f3ec] px-4 py-3">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[12px] font-medium text-[#52626c]">
                {reading.label}
              </p>
              <p className="mt-1 text-[1.7rem] font-semibold leading-none tracking-[-0.05em] tabular-nums text-[#153044]">
                {reading.value}
                {reading.unit ? (
                  <span className="ml-1 text-[0.95rem] tracking-[-0.02em] text-[#52626c]">
                    {reading.unit}
                  </span>
                ) : null}
              </p>
            </div>
            <div className="text-right text-[11px] text-[#6b777f]">
              <p>
                {updated ? `Updated ${updated}` : 'Updated by Home Assistant'}
              </p>
              {reading.entityId ? (
                <p className="mt-1">{reading.entityId}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : issue ? (
        <div className="flex items-center justify-between gap-3 border-t border-[#e8e1d7] px-4 py-3">
          <p className="max-w-[190px] text-[12px] leading-5 text-[#52626c]">
            Oriel reads sensors only. It cannot control Home Assistant devices.
          </p>
          {reading?.status === 'not_configured' ? (
            <AppLink
              href="/app/settings"
              className="shrink-0 text-[12px] font-semibold text-[#815f2c]"
            >
              {issue.action} →
            </AppLink>
          ) : (
            <Button
              variant="ghost"
              className="h-8 shrink-0 rounded-full px-3 text-[12px] text-[#815f2c] hover:bg-[#efe7da] hover:text-[#5b421b]"
              onClick={() => void refresh()}
              disabled={loading}
            >
              <RefreshCw
                className={cn('mr-1.5 size-3.5', loading && 'animate-spin')}
              />
              {issue.action}
            </Button>
          )}
        </div>
      ) : null}
    </section>
  );
}
