'use client';

import { AppLink } from '@/components/app/app-link';
import { ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/app/app-shell';
import { StatusBadge } from '@/components/app/status-badge';
import { ValueRatioBoard } from '@/components/app/value-ratio-board';
import {
  homeCategories,
  homeExceptions,
  overallHomeStatus,
  periodTotals,
} from '@/lib/fixtures/home-summary';
import { demoUser } from '@/lib/fixtures/property';
import { discussionStatus } from '@/lib/fixtures/stages';
import { cn } from '@/lib/utils';

export default function HomePage() {
  return (
    <div>
      <PageHeader
        eyebrow="Home"
        title={`${demoUser.firstName}'s home`}
        description="Simple picture first: what you paid, what you received, what is normal, and what needs a look. Detail opens only when you go into a category."
      />

      <p className="mb-8 max-w-3xl border border-[#e0d2a8] bg-[#f7f1e0] px-4 py-3 text-sm leading-6 text-[#6d5a2c]">
        {discussionStatus.prototypeNote}{' '}
        <AppLink href="/app/stages" className="font-medium underline">
          See stages
        </AppLink>
        .
      </p>

      <section className="mb-8 grid gap-3 md:grid-cols-3">
        <article className="border border-[#d8d0c3] bg-[#fcfbf8] p-5 md:col-span-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8f7040]">
            Status
          </p>
          <div className="mt-3">
            <StatusBadge state="normal" label={overallHomeStatus.label} />
          </div>
          <p className="mt-3 text-sm leading-6 text-[#52626c]">
            {overallHomeStatus.detail}
          </p>
        </article>
        <article className="border border-[#d8d0c3] bg-[#fcfbf8] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8f7040]">
            Paid · {periodTotals.periodLabel}
          </p>
          <p className="mt-3 font-serif text-4xl tracking-[-0.04em] text-[#153044]">
            {periodTotals.spent}
          </p>
          <p className="mt-2 text-sm text-[#5a6a73]">
            Electricity, water and supporting care
          </p>
        </article>
        <article className="border border-[#d8d0c3] bg-[#fcfbf8] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8f7040]">
            Received
          </p>
          <p className="mt-3 font-serif text-4xl tracking-[-0.04em] text-[#153044]">
            {periodTotals.ratio}
          </p>
          <p className="mt-2 text-sm leading-5 text-[#5a6a73]">
            {periodTotals.ratioPlain}
          </p>
        </article>
      </section>

      <ValueRatioBoard compact className="mb-10" />

      <section className="mb-10">
        <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8f7040]">
          Categories
        </h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {homeCategories.map((category) => (
            <AppLink
              key={category.id}
              href={category.href}
              className={cn(
                'border border-[#d8d0c3] bg-[#fcfbf8] p-5 transition hover:border-[#c3ad85] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a88348]/50',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
                    {category.benefitKind}
                  </p>
                  <h3 className="mt-2 text-xl font-medium tracking-[-0.02em] text-[#153044]">
                    {category.name}
                  </h3>
                </div>
                <StatusBadge
                  state={category.status === 'ok' ? 'normal' : 'attention'}
                  label={category.statusLabel}
                />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9aa3aa]">
                    Paid
                  </p>
                  <p className="mt-1 font-serif text-2xl tracking-[-0.03em] text-[#153044]">
                    {category.spent}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9aa3aa]">
                    Received
                  </p>
                  <p className="mt-1 text-sm leading-5 text-[#243a48]">
                    {category.benefit}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-[#52626c]">
                {category.plainSummary}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#815f2c]">
                Open <ArrowRight className="size-3.5" />
              </span>
            </AppLink>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8f7040]">
          Exceptions
        </h2>
        <div className="space-y-3">
          {homeExceptions.map((item) => (
            <AppLink
              key={item.id}
              href={item.href}
              className="block border border-[#e0c4b0] bg-[#fdf8f5] p-5 transition hover:border-[#c3ad85]"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
                {item.category}
              </p>
              <h3 className="mt-2 text-lg font-medium text-[#153044]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#52626c]">
                {item.whyItMatters}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#815f2c]">
                Review <ArrowRight className="size-3.5" />
              </span>
            </AppLink>
          ))}
        </div>
      </section>
    </div>
  );
}
