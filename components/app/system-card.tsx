'use client';

import { ChevronRight } from 'lucide-react';
import { StatusBadge } from '@/components/app/status-badge';
import type { ConditionState, SystemId } from '@/lib/fixtures/types';
import { cn } from '@/lib/utils';

type SystemCardModel = {
  id: SystemId;
  name: string;
  condition: ConditionState;
  conditionLabel: string;
  watching: string;
  reading?: string;
  lastUpdated?: string;
  lastVerified?: string;
};

export function SystemCard({
  system,
  onOpen,
  className,
}: {
  system: SystemCardModel;
  onOpen?: () => void;
  className?: string;
}) {
  const reading = system.reading ?? '';
  const lastUpdated = system.lastUpdated ?? system.lastVerified ?? '';
  const interactive = Boolean(onOpen);

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-medium tracking-[-0.02em] text-[#153044]">
            {system.name}
          </h3>
          {reading ? (
            <p className="mt-1 text-sm text-[#5a6a73]">{reading}</p>
          ) : null}
        </div>
        <StatusBadge state={system.condition} label={system.conditionLabel} />
      </div>
      <p className="mt-4 text-sm leading-6 text-[#52626c]">{system.watching}</p>
      <div className="mt-5 flex items-center justify-between gap-3 text-xs text-[#6b777f]">
        <span>{lastUpdated}</span>
        {interactive ? (
          <span className="inline-flex items-center gap-1 font-medium text-[#815f2c]">
            Inspect <ChevronRight className="size-3.5" />
          </span>
        ) : null}
      </div>
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          'w-full border border-[#d8d0c3] bg-[#fcfbf8] p-5 text-left shadow-[0_10px_30px_rgba(31,43,52,0.04)] transition hover:border-[#c3ad85] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a88348]/50',
          className,
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <article
      className={cn(
        'border border-[#d8d0c3] bg-[#fcfbf8] p-5 shadow-[0_10px_30px_rgba(31,43,52,0.04)]',
        className,
      )}
    >
      {content}
    </article>
  );
}
