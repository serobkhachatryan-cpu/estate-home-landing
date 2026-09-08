'use client';

import { AppLink } from '@/components/app/app-link';
import { PageHeader } from '@/components/app/app-shell';
import { ValueRatioBoard } from '@/components/app/value-ratio-board';

export default function SpendingPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Spending"
        title="Spend only matters with benefit."
        description="This route keeps the old name for continuity. The Stage 1 view is Paid → received for electricity and water."
      />
      <ValueRatioBoard />
      <p className="mt-6 text-sm text-[#6b777f]">
        Prefer the product name?{' '}
        <AppLink
          href="/app/value"
          className="font-medium text-[#815f2c] underline"
        >
          Open Paid → received
        </AppLink>
      </p>
    </div>
  );
}
