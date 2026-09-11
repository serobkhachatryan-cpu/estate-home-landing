'use client';

import { AppLink } from '@/components/app/app-link';
import { PageHeader } from '@/components/app/app-shell';
import { SpendParameterStrip } from '@/components/app/spend-parameter-strip';
import { SpendWeeklyTape } from '@/components/app/spend-weekly-tape';
import { ArrowRight } from 'lucide-react';
import { homeExceptions } from '@/lib/fixtures/home-summary';
import { demoUser } from '@/lib/fixtures/property';
import {
  formatSpend,
  spendHeadline,
  spendParameters,
  varianceAgainstPlan,
} from '@/lib/fixtures/spend-tree';

export default function HomePage() {
  const overPlan = spendParameters.filter(
    (item) => varianceAgainstPlan(item.fact, item.plan) === 'over',
  );

  return (
    <div>
      <PageHeader title={demoUser.firstName} />

      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
        Home spend
      </p>
      <p className="text-[13px] text-[#6b777f]">
        Plan and Fact for 52 UK weeks stay on screen — move the yellow line to
        recalculate. Annual sketch:{' '}
        {formatSpend(spendHeadline.plan)} / {formatSpend(spendHeadline.fact, 0)}{' '}
        · {overPlan.length} lines hot
      </p>

      <section className="mt-5">
        <SpendParameterStrip parameters={spendParameters} />
      </section>

      <SpendWeeklyTape
        className="mt-5"
        subject={{
          id: 'headline-total',
          name: 'Home',
          plan: spendHeadline.plan,
          fact: spendHeadline.fact,
          forecast: spendHeadline.forecast,
        }}
      />

      <section className="mt-6 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
          Needs a look
        </p>
        {homeExceptions.map((item) => (
          <AppLink
            key={item.id}
            href={item.href}
            className="flex items-center justify-between gap-3 rounded-2xl bg-[#fdf8f5] px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-[11px] text-[#8f7040]">{item.category}</p>
              <p className="truncate text-[14px] font-medium text-[#153044]">
                {item.title}
              </p>
            </div>
            <ArrowRight className="size-4 shrink-0 text-[#815f2c]" />
          </AppLink>
        ))}
      </section>
    </div>
  );
}
