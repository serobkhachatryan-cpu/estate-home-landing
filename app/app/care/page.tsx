'use client';

import { AppLink } from '@/components/app/app-link';
import { PageHeader } from '@/components/app/app-shell';
import { StatusBadge } from '@/components/app/status-badge';
import { homeCategories } from '@/lib/fixtures/home-summary';

export default function CarePage() {
  const wear = homeCategories.find((item) => item.id === 'wear');
  const care = homeCategories.find((item) => item.id === 'care');
  const investment = homeCategories.find((item) => item.id === 'investment');

  return (
    <div>
      <PageHeader
        eyebrow="Care"
        title="Wear, supporting work, investment results."
        description="Shown as context for electricity and water — not as a separate gadget dashboard. Methodology for wear and care value is still open with Timur."
      />

      <div className="space-y-4">
        {[wear, care, investment].filter(Boolean).map((item) =>
          item ? (
            <article
              key={item.id}
              className="border border-[#d8d0c3] bg-[#fcfbf8] p-5"
            >
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-medium text-[#153044]">
                  {item.name}
                </h2>
                <StatusBadge
                  state={item.status === 'ok' ? 'normal' : 'attention'}
                  label={item.statusLabel}
                />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8f7040]">
                    Paid
                  </p>
                  <p className="mt-1 font-serif text-3xl tracking-[-0.03em]">
                    {item.spent}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8f7040]">
                    Received · {item.benefitKind}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#243a48]">
                    {item.benefit}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#52626c]">
                {item.plainSummary}
              </p>
            </article>
          ) : null,
        )}
      </div>

      <p className="mt-8 max-w-2xl text-sm leading-6 text-[#6b777f]">
        Open: how to measure natural wear in plain language, and how to express
        the value of supporting work. That waits for Timur’s framing — see{' '}
        <AppLink
          href="/app/stages"
          className="font-medium text-[#815f2c] underline"
        >
          Stages
        </AppLink>
        .
      </p>
    </div>
  );
}
