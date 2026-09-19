'use client';

import { AppLink } from '@/components/app/app-link';
import { useState } from 'react';
import { PageHeader } from '@/components/app/app-shell';
import { ImportedSensorBreakdown } from '@/components/app/imported-sensor-breakdown';
import { Button } from '@/components/ui/button';
import type { UtilityDetail } from '@/lib/fixtures/utilities';

export function UtilityDetailPage({ detail }: { detail: UtilityDetail }) {
  const [resolved, setResolved] = useState(false);

  return (
    <div>
      <AppLink
        href="/app/spending/utilities"
        className="mb-3 inline-block text-[12px] font-medium text-[#815f2c]"
      >
        ← Utilities
      </AppLink>

      <PageHeader title={detail.name} />

      <ImportedSensorBreakdown
        groupId={detail.id === 'electricity' ? 'power' : 'water'}
        primaryEntityId={
          detail.id === 'electricity'
            ? 'sensor.shellypro3em_9454c5b9da04_energy'
            : 'sensor.house_water_1_total_l'
        }
        note={
          detail.id === 'electricity'
            ? 'Each feeder, total and phase is a separate source. Oriel does not add a meter total to its phase branches or make an unsupported estate-wide energy total.'
            : 'Each meter and flow source is kept separate. Water use is calculated only from consecutive meter states; Home Assistant sum fields are not used for these meters.'
        }
      />

      <section className="mb-4 rounded-2xl border border-[#e0d8cb] bg-[#fcfbf8] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
          Financial data
        </p>
        <p className="mt-1 text-[12px] leading-5 text-[#52626c]">
          Meter history measures consumption, not billed spend. Oriel will not
          show a utility cost as fact until invoices or an approved tariff
          model are imported. Any estimate is labelled separately.
        </p>
      </section>

      {detail.exception && !resolved ? (
        <section className="mt-4 rounded-2xl bg-[#fdf8f5] px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
            Exception
          </p>
          <h3 className="mt-1 text-[15px] font-medium text-[#153044]">
            {detail.exception.title}
          </h3>
          <p className="mt-1 text-[13px] leading-5 text-[#52626c]">
            {detail.exception.detail}
          </p>
          <Button
            className="mt-3 h-9 rounded-full bg-[#173850] px-4 text-[13px] hover:bg-[#0d283b]"
            onClick={() => setResolved(true)}
          >
            Mark reviewed
          </Button>
        </section>
      ) : null}
    </div>
  );
}
