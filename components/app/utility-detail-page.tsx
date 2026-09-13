'use client';

import { AppLink } from '@/components/app/app-link';
import { useState } from 'react';
import { PageHeader } from '@/components/app/app-shell';
import { HomeAssistantUtilityStatus } from '@/components/app/home-assistant-utility-status';
import { SpendWeeklyTape } from '@/components/app/spend-weekly-tape';
import { Button } from '@/components/ui/button';
import type { UtilityDetail } from '@/lib/fixtures/utilities';
import { getSpendSubparameter } from '@/lib/fixtures/spend-tree';

export function UtilityDetailPage({ detail }: { detail: UtilityDetail }) {
  const [resolved, setResolved] = useState(false);
  const subId = detail.id === 'electricity' ? 'energy' : 'water';
  const match = getSpendSubparameter('utilities', subId);
  const sub = match?.subparameter;

  return (
    <div>
      <AppLink
        href="/app/spending/utilities"
        className="mb-3 inline-block text-[12px] font-medium text-[#815f2c]"
      >
        ← Utilities
      </AppLink>

      <PageHeader title={detail.name} />

      <HomeAssistantUtilityStatus utility={detail.id} />

      <SpendWeeklyTape
        subject={{
          id: `utilities:${subId}`,
          name: sub?.name ?? detail.name,
          plan: sub?.plan ?? 0,
          fact: sub?.fact ?? 0,
          forecast: sub?.forecast ?? 0,
        }}
      />

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
