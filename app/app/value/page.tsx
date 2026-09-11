'use client';

import { AppLink } from '@/components/app/app-link';
import { PageHeader } from '@/components/app/app-shell';
import { ValueRatioBoard } from '@/components/app/value-ratio-board';

export default function ValuePage() {
  return (
    <div>
      <AppLink
        href="/app/settings"
        className="mb-3 inline-block text-[12px] font-medium text-[#815f2c]"
      >
        ← Settings
      </AppLink>
      <PageHeader title="Paid → received" />
      <ValueRatioBoard />
    </div>
  );
}
