'use client';

import { AppLink } from '@/components/app/app-link';
import { ArrowRight } from 'lucide-react';
import {
  valueRatioBoard,
  valueRatioSummary,
  type ValueRatioItem,
} from '@/lib/fixtures/value-ratio';
import { cn } from '@/lib/utils';

function RatioRow({ item }: { item: ValueRatioItem }) {
  return (
    <article className="grid gap-4 border-b border-[#e0d8cb] px-5 py-5 last:border-b-0 lg:grid-cols-[0.9fr_1.15fr_0.85fr] lg:items-start">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8f7040]">
          {item.category}
        </p>
        <p className="mt-3 font-serif text-3xl tracking-[-0.04em] text-[#153044]">
          {item.spent}
        </p>
        <p className="mt-1 text-sm text-[#5a6a73]">{item.spentNote}</p>
      </div>

      <div className="flex gap-3">
        <ArrowRight
          className="mt-1 hidden size-4 shrink-0 text-[#a88348] sm:block"
          strokeWidth={1.5}
          aria-hidden
        />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
            Received · {item.benefitKind}
          </p>
          <p className="mt-2 text-base font-medium leading-6 text-[#243a48]">
            {item.benefit}
          </p>
          <p className="mt-2 text-sm leading-5 text-[#52626c]">
            {item.explanation}
          </p>
        </div>
      </div>

      <div className="border border-[#e0d8cb] bg-[#f5f1e9] px-4 py-3 lg:text-right">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
          Ratio
        </p>
        <p className="mt-2 font-serif text-2xl tracking-[-0.03em] text-[#153044]">
          {item.ratioLabel}
        </p>
        <p className="mt-1 text-xs leading-5 text-[#5a6a73]">
          {item.ratioDetail}
        </p>
      </div>
    </article>
  );
}

export function ValueRatioBoard({
  className,
  compact,
}: {
  className?: string;
  compact?: boolean;
}) {
  const rows = compact
    ? valueRatioBoard.filter(
        (item) => item.id === 'electricity' || item.id === 'water',
      )
    : valueRatioBoard;

  return (
    <section className={cn(className)} aria-labelledby="value-ratio-heading">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="value-ratio-heading"
            className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8f7040]"
          >
            Paid → received
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#52626c]">
            For Timur, the product starts here: what was paid, and what useful
            outcome came back — not raw kWh or litres alone.
          </p>
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#9aa3aa]">
          {valueRatioSummary.period} · stage 1 sketch
        </p>
      </div>

      <div className="overflow-hidden border border-[#d8d0c3] bg-[#fcfbf8] shadow-[0_14px_40px_rgba(31,43,52,0.05)]">
        <div className="grid gap-4 border-b border-[#d8d0c3] bg-[#f0eadf] px-5 py-5 sm:grid-cols-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8f7040]">
              Paid
            </p>
            <p className="mt-2 font-serif text-4xl tracking-[-0.04em] text-[#153044]">
              {valueRatioSummary.totalSpent}
            </p>
            <p className="mt-1 text-xs text-[#5a6a73]">
              This month · priority utilities + care
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8f7040]">
              Received
            </p>
            <p className="mt-2 font-serif text-4xl tracking-[-0.04em] text-[#153044]">
              {valueRatioSummary.totalBenefit}
            </p>
            <p className="mt-1 text-xs text-[#5a6a73]">
              Useful outcome and avoided waste
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8f7040]">
              Ratio
            </p>
            <p className="mt-2 font-serif text-4xl tracking-[-0.04em] text-[#153044]">
              {valueRatioSummary.headlineRatio}
            </p>
            <p className="mt-1 text-xs text-[#5a6a73]">
              Illustrative return per £1 paid
            </p>
          </div>
        </div>

        <div>
          {rows.map((item) => (
            <RatioRow key={item.id} item={item} />
          ))}
        </div>

        {compact ? (
          <div className="border-t border-[#e0d8cb] px-5 py-3 text-sm text-[#52626c]">
            Full board with supporting work:{' '}
            <AppLink
              href="/app/value"
              className="font-medium text-[#815f2c] underline"
            >
              Paid → received
            </AppLink>
          </div>
        ) : null}
      </div>
    </section>
  );
}
