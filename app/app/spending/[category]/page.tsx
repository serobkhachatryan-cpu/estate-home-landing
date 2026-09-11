'use client';

import { notFound } from 'next/navigation';
import { use, useEffect } from 'react';
import { AppLink } from '@/components/app/app-link';
import { SubparameterList } from '@/components/app/cash-flow-panel';
import { PageHeader } from '@/components/app/app-shell';
import { SpendParameterStrip } from '@/components/app/spend-parameter-strip';
import { SpendWeeklyTape } from '@/components/app/spend-weekly-tape';
import {
  getSpendParameter,
  resolveSpendParameterId,
  spendParameters,
} from '@/lib/fixtures/spend-tree';

export default function SpendCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = use(params);
  const resolvedId = resolveSpendParameterId(category);
  const parameter = getSpendParameter(category);

  useEffect(() => {
    if (resolvedId !== category) {
      window.location.replace(`/app/spending/${resolvedId}`);
    }
  }, [category, resolvedId]);

  if (!parameter) {
    notFound();
  }

  return (
    <div>
      <AppLink
        href="/app/spending"
        className="mb-3 inline-block text-[12px] font-medium text-[#815f2c]"
      >
        ← Spend
      </AppLink>

      <PageHeader title={parameter.name} description={parameter.blurb} />

      <SpendParameterStrip
        parameters={spendParameters}
        activeId={parameter.id}
        compact
      />

      <SpendWeeklyTape
        className="mt-4"
        subject={{
          id: parameter.id,
          name: parameter.name,
          plan: parameter.plan,
          fact: parameter.fact,
          forecast: parameter.forecast,
        }}
      />

      <div className="mt-5">
        <SubparameterList parameter={parameter} />
      </div>
    </div>
  );
}
