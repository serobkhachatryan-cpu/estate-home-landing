'use client';

import { AppLink } from '@/components/app/app-link';
import { PageHeader } from '@/components/app/app-shell';
import { demoProperty, demoUser } from '@/lib/fixtures/property';

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" />

      <div className="space-y-2">
        <div className="rounded-2xl bg-[#fcfbf8] px-4 py-3">
          <p className="text-[11px] text-[#8f7040]">Person</p>
          <p className="mt-1 text-[15px] font-medium text-[#153044]">
            {demoUser.name}
          </p>
        </div>
        <div className="rounded-2xl bg-[#fcfbf8] px-4 py-3">
          <p className="text-[11px] text-[#8f7040]">Home</p>
          <p className="mt-1 text-[15px] font-medium text-[#153044]">
            {demoProperty.name}
          </p>
          <p className="text-[12px] text-[#6b777f]">{demoProperty.area}</p>
        </div>
        <AppLink
          href="/app/value"
          className="block rounded-2xl bg-[#fcfbf8] px-4 py-3 text-[14px] font-medium text-[#153044]"
        >
          Paid → received
        </AppLink>
        <AppLink
          href="/app/stages"
          className="block rounded-2xl bg-[#fcfbf8] px-4 py-3 text-[14px] font-medium text-[#153044]"
        >
          Stages
        </AppLink>
        <AppLink
          href="/"
          className="block rounded-2xl bg-[#fcfbf8] px-4 py-3 text-[14px] font-medium text-[#153044]"
        >
          Marketing site
        </AppLink>
      </div>
    </div>
  );
}
