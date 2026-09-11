'use client';

import { SpendWeeklyTape } from '@/components/app/spend-weekly-tape';
import { getSpendSubparameter } from '@/lib/fixtures/spend-tree';

/** Energy tape — same vertical native scroll as every other parameter. */
export function ElectricityWeeklyTape({ className }: { className?: string }) {
  const match = getSpendSubparameter('utilities', 'energy');
  const sub = match?.subparameter;

  return (
    <SpendWeeklyTape
      className={className}
      subject={{
        id: 'utilities:energy',
        name: sub?.name ?? 'Energy',
        plan: sub?.plan ?? 28_000,
        fact: sub?.fact ?? 31_420,
        forecast: sub?.forecast ?? 29_800,
      }}
    />
  );
}
