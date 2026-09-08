'use client';

import { PageHeader } from '@/components/app/app-shell';
import { ValueRatioBoard } from '@/components/app/value-ratio-board';

export default function ValuePage() {
  return (
    <div>
      <PageHeader
        eyebrow="Paid → received"
        title="What the money bought."
        description="Core product question for Timur: expenses for the period, and the useful outcome — not consumption for its own sake."
      />
      <ValueRatioBoard />
    </div>
  );
}
