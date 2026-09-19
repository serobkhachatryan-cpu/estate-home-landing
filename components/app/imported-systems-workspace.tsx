'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ImportedSensorBreakdown } from '@/components/app/imported-sensor-breakdown';
import { SystemCard } from '@/components/app/system-card';
import type {
  ImportedSensorGroup,
  SensorHistoryOverviewResponse,
} from '@/lib/sensor-history-types';

type LoadState =
  | { phase: 'loading' }
  | { phase: 'error' }
  | { phase: 'ready'; data: SensorHistoryOverviewResponse };

const systemDescriptions: Record<string, string> = {
  power:
    'Feeder meters, electrical branches, phases, power quality and UPS evidence. Totals and branches remain separate.',
  water:
    'Main, house and lodge meter/flow evidence. Each meter is read independently; no unsupported site total is created.',
  fuel:
    'Fuel-tank and resilience measurements from the historical recorder. Oriel does not infer a burn rate or service status.',
  climate:
    'Area environment and weather-station statistics: temperature, humidity, illuminance, rain, wind, solar and pressure.',
  security:
    'Operational telemetry only: NVR capacity, recording mix, camera storage/write rate and battery history. No footage or access claims.',
  network:
    'Starlink, node health, switch/PoE and equipment telemetry. Overlapping sources stay distinct rather than being combined.',
  care:
    'Printer consumable history from the recorder. This is measured stock, not a service ticket or cost record.',
  sensors:
    'Additional historical statistics that do not safely belong to a utility or equipment group.',
};

const displayOrder = [
  'power',
  'water',
  'fuel',
  'climate',
  'security',
  'network',
  'care',
  'sensors',
];

const primarySources: Record<string, string> = {
  power: 'sensor.shellypro3em_9454c5b9da04_energy',
  water: 'sensor.house_water_1_total_l',
  security: 'sensor.aldworth_nvr_storage_utilization',
  network: 'sensor.starlink_ping_2',
};

function isOverview(value: unknown): value is SensorHistoryOverviewResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    ((value as { status?: unknown }).status === 'available' ||
      (value as { status?: unknown }).status === 'not_imported') &&
    Array.isArray((value as { groups?: unknown }).groups) &&
    Array.isArray((value as { sources?: unknown }).sources)
  );
}

function conditionFor(group: ImportedSensorGroup) {
  if (group.availableCount === group.sourceCount) {
    return { condition: 'normal' as const, label: 'Recorded' };
  }
  if (group.availableCount > 0) {
    return { condition: 'watch' as const, label: 'Partial history' };
  }
  return { condition: 'attention' as const, label: 'Needs review' };
}

/**
 * This is the original Systems workspace, now driven by recorder-backed
 * groups instead of its sample boiler, gate, and failover narratives.
 */
export function ImportedSystemsWorkspace({
  historyEndpoint = '/api/sensor-history',
  accessToken,
}: {
  historyEndpoint?: string;
  accessToken?: string;
}) {
  const [state, setState] = useState<LoadState>({ phase: 'loading' });
  const [selectedGroupId, setSelectedGroupId] = useState('power');

  const load = useCallback(async () => {
    try {
      const response = await fetch(historyEndpoint, {
        cache: 'no-store',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });
      const payload: unknown = await response.json();
      if (!response.ok || !isOverview(payload)) throw new Error('Unavailable');
      setState({ phase: 'ready', data: payload });
    } catch {
      setState({ phase: 'error' });
    }
  }, [accessToken, historyEndpoint]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const groups = useMemo(() => {
    if (state.phase !== 'ready') return [];
    const byId = new Map(state.data.groups.map((group) => [group.id, group]));
    return displayOrder
      .map((id) => byId.get(id))
      .filter((group): group is ImportedSensorGroup => Boolean(group));
  }, [state]);

  if (state.phase === 'loading') {
    return <p className="text-[13px] text-[#6b777f]">Loading recorded systems…</p>;
  }

  if (state.phase === 'error') {
    return (
      <p className="rounded-2xl bg-[#fdf8f5] px-4 py-3 text-[13px] text-[#8a4b3a]">
        Oriel could not load the recorded sensor inventory.
      </p>
    );
  }

  if (state.data.status === 'not_imported' || !groups.length) {
    return <p className="text-[13px] text-[#6b777f]">{state.data.detail}</p>;
  }

  const selected =
    groups.find((group) => group.id === selectedGroupId) ?? groups[0]!;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {groups.map((group) => {
          const condition = conditionFor(group);
          return (
            <SystemCard
              key={group.id}
              system={{
                id: group.id,
                name: group.label,
                condition: condition.condition,
                conditionLabel: condition.label,
                reading: `${group.availableCount} / ${group.sourceCount} sources with complete daily history`,
                lastUpdated: 'Historical snapshot through 19 Sept 2026',
                watching: systemDescriptions[group.id] ?? systemDescriptions.sensors,
              }}
              onOpen={() => setSelectedGroupId(group.id)}
              className={group.id === selected.id ? 'border-[#a88348]' : undefined}
            />
          );
        })}
      </div>

      <ImportedSensorBreakdown
        groupId={selected.id}
        primaryEntityId={primarySources[selected.id]}
        note={systemDescriptions[selected.id] ?? systemDescriptions.sensors}
        historyEndpoint={historyEndpoint}
        accessToken={accessToken}
      />
    </div>
  );
}
