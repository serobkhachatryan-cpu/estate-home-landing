'use client';

import { AppLink } from '@/components/app/app-link';
import { PageHeader } from '@/components/app/app-shell';
import { discussionStatus, productStages } from '@/lib/fixtures/stages';
import { cn } from '@/lib/utils';

const whenStyles = {
  now: 'bg-[#eef4ea] text-[#2f4a34]',
  next: 'bg-[#f7f1e0] text-[#6d5a2c]',
  later: 'bg-[#f0ebe3] text-[#5a6270]',
} as const;

export default function StagesPage() {
  return (
    <div>
      <AppLink
        href="/app/settings"
        className="mb-3 inline-block text-[12px] font-medium text-[#815f2c]"
      >
        ← Settings
      </AppLink>
      <PageHeader title="Stages" description={discussionStatus.prototypeNote} />

      <div className="space-y-3">
        {productStages.map((stage) => (
          <article key={stage.id} className="rounded-2xl bg-[#fcfbf8] p-4">
            <span
              className={cn(
                'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]',
                whenStyles[stage.when],
              )}
            >
              {stage.when}
            </span>
            <h2 className="mt-2 text-[15px] font-medium text-[#153044]">
              {stage.title}
            </h2>
            <p className="mt-1 text-[13px] leading-5 text-[#52626c]">
              {stage.summary}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
