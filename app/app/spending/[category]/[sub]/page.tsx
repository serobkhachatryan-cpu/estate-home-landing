'use client';

import { notFound } from 'next/navigation';
import { use } from 'react';
import { AppLink } from '@/components/app/app-link';
import { PageHeader } from '@/components/app/app-shell';
import { SpendWeeklyTape } from '@/components/app/spend-weekly-tape';
import { getSpendSubparameter } from '@/lib/fixtures/spend-tree';

export default function SpendSubparameterPage({
  params,
}: {
  params: Promise<{ category: string; sub: string }>;
}) {
  const { category, sub } = use(params);
  const match = getSpendSubparameter(category, sub);

  if (!match) {
    notFound();
  }

  const { parameter, subparameter } = match;

  return (
    <div>
      <AppLink
        href={`/app/spending/${parameter.id}`}
        className="mb-3 inline-block text-[12px] font-medium text-[#815f2c]"
      >
        ← {parameter.name}
      </AppLink>

      <PageHeader
        title={subparameter.name}
        description={subparameter.note}
        actions={
          subparameter.href ? (
            <AppLink
              href={subparameter.href}
              className="text-[12px] font-medium text-[#815f2c]"
            >
              Detail
            </AppLink>
          ) : undefined
        }
      />

      <SpendWeeklyTape
        subject={{
          id: `${parameter.id}:${subparameter.id}`,
          name: subparameter.name,
          plan: subparameter.plan,
          fact: subparameter.fact,
          forecast: subparameter.forecast,
        }}
      />
    </div>
  );
}
