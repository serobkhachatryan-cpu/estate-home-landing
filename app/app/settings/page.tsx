'use client';

import { AppLink } from '@/components/app/app-link';
import { PageHeader } from '@/components/app/app-shell';
import { demoProperty, demoUser } from '@/lib/fixtures/property';
import { discussionStatus } from '@/lib/fixtures/stages';

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Settings"
        title="Pilot notes"
        description="Prototype settings for Timur’s home. No live accounts or devices."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="border border-[#d8d0c3] bg-[#fcfbf8] p-5">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8f7040]">
            Person
          </h2>
          <p className="mt-3 text-lg font-medium text-[#153044]">
            {demoUser.name}
          </p>
          <p className="mt-1 text-sm text-[#5a6a73]">
            First product user · pilot
          </p>
        </section>
        <section className="border border-[#d8d0c3] bg-[#fcfbf8] p-5">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8f7040]">
            Home
          </h2>
          <p className="mt-3 text-lg font-medium text-[#153044]">
            {demoProperty.label}
          </p>
          <p className="mt-1 text-sm text-[#5a6a73]">
            First concrete example — not a marketing estate
          </p>
        </section>
        <section className="border border-[#d8d0c3] bg-[#fcfbf8] p-5 lg:col-span-2">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8f7040]">
            Discussion status
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#52626c]">
            {discussionStatus.waitingOn}
          </p>
          <p className="mt-2 text-sm leading-6 text-[#52626c]">
            {discussionStatus.prototypeNote}
          </p>
          <AppLink
            href="/app/stages"
            className="mt-4 inline-block text-sm font-medium text-[#815f2c] underline"
          >
            Open stages
          </AppLink>
        </section>
      </div>
    </div>
  );
}
