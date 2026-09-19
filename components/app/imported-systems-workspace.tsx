'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ImportedSensorBreakdown } from '@/components/app/imported-sensor-breakdown';
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
  fuel: 'Fuel-tank and resilience measurements from the historical recorder. Oriel does not infer a burn rate or service status.',
  climate:
    'Area environment and weather-station statistics: temperature, humidity, illuminance, rain, wind, solar and pressure.',
  security:
    'Operational telemetry only: NVR capacity, recording mix, camera storage/write rate and battery history. No footage or access claims.',
  network:
    'Starlink, node health, switch/PoE and equipment telemetry. Overlapping sources stay distinct rather than being combined.',
  care: 'Printer consumable history from the recorder. This is measured stock, not a service ticket or cost record.',
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

/**
 * Direct system navigation for the original Oriel workspace. A system and a
 * parameter are chosen in native controls immediately above the reading.
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
  const [selectedSourceByGroup, setSelectedSourceByGroup] = useState<
    Record<string, string>
  >({});

  const load = useCallback(async () => {
    try {
      const response = await fetch(historyEndpoint, {
        cache: 'no-store',
        headers: accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : undefined,
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
    return (
      <p className="text-[13px] text-[#6b777f]">Loading recorded systems…</p>
    );
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
    <div className="space-y-4">
      <section className="rounded-2xl border border-[#e0d8cb] bg-[#fcfbf8] px-4 py-3">
        <label
          htmlFor="recorded-system"
          className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]"
        >
          System
        </label>
        <select
          id="recorded-system"
          value={selected.id}
          onChange={(event) => setSelectedGroupId(event.target.value)}
          className="mt-1.5 h-11 w-full appearance-auto rounded-xl border border-[#d8cdbd] bg-white px-3 text-[14px] font-medium text-[#153044] outline-none transition focus:border-[#a88348] focus:ring-2 focus:ring-[#a88348]/20"
        >
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-[10px] leading-4 text-[#6b777f]">
          {selected.availableCount} of {selected.sourceCount} sources have a
          complete daily record.
        </p>
      </section>

      <ImportedSensorBreakdown
        key={selected.id}
        groupId={selected.id}
        primaryEntityId={primarySources[selected.id]}
        note={systemDescriptions[selected.id] ?? systemDescriptions.sensors}
        historyEndpoint={historyEndpoint}
        accessToken={accessToken}
        selectedEntityId={selectedSourceByGroup[selected.id]}
        onSelectEntityId={(entityId) =>
          setSelectedSourceByGroup((current) => ({
            ...current,
            [selected.id]: entityId,
          }))
        }
      />
    </div>
  );
}
