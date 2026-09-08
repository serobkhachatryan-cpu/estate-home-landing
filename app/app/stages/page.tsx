'use client';

import { PageHeader } from '@/components/app/app-shell';
import { discussionStatus, productStages } from '@/lib/fixtures/stages';
import { cn } from '@/lib/utils';

const whenStyles = {
  now: 'border-[#c5d4c0] bg-[#eef4ea] text-[#2f4a34]',
  next: 'border-[#e0d2a8] bg-[#f7f1e0] text-[#6d5a2c]',
  later: 'border-[#d2ccc2] bg-[#f0ebe3] text-[#5a6270]',
} as const;

export default function StagesPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Stages"
        title="Big vision, cut into now / next / later."
        description="Homework from the discussion with Timur: do not build everything at once. This is the working split."
      />

      <div className="mb-8 space-y-3 border border-[#d8d0c3] bg-[#fcfbf8] p-5 text-sm leading-6 text-[#52626c]">
        <p>
          <strong className="text-[#243a48]">Waiting on Timur:</strong>{' '}
          {discussionStatus.waitingOn}
        </p>
        <p>
          <strong className="text-[#243a48]">Your homework:</strong>{' '}
          {discussionStatus.yourHomework}
        </p>
        <p>
          <strong className="text-[#243a48]">Sasha:</strong>{' '}
          {discussionStatus.sashaNote}
        </p>
        <p className="text-[#6b777f]">{discussionStatus.prototypeNote}</p>
      </div>

      <div className="space-y-5">
        {productStages.map((stage) => (
          <article
            key={stage.id}
            className="border border-[#d8d0c3] bg-[#fcfbf8] p-6"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  'inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]',
                  whenStyles[stage.when],
                )}
              >
                {stage.when}
              </span>
              <h2 className="text-xl font-medium tracking-[-0.02em] text-[#153044]">
                {stage.title}
              </h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#52626c]">
              {stage.summary}
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-[#243a48]">
              {stage.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {stage.openQuestions ? (
              <div className="mt-5 border-t border-[#e0d8cb] pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
                  Still open
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-[#52626c]">
                  {stage.openQuestions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
