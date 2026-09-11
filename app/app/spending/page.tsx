'use client';

import { PageHeader } from '@/components/app/app-shell';
import { SpendParameterStrip } from '@/components/app/spend-parameter-strip';
import { SpendWeeklyTape } from '@/components/app/spend-weekly-tape';
import {
  spendHeadline,
  spendParameters,
} from '@/lib/fixtures/spend-tree';

export default function SpendingPage() {
  return (
    <div>
      <PageHeader title="Spend" />

      <SpendWeeklyTape
        subject={{
          id: 'headline-total',
          name: 'Home',
          plan: spendHeadline.plan,
          fact: spendHeadline.fact,
          forecast: spendHeadline.forecast,
        }}
      />

      <section className="mt-5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
          Parameters
        </p>
        <SpendParameterStrip parameters={spendParameters} />
      </section>
    </div>
  );
}
