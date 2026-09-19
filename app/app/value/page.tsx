'use client';

import { AppLink } from '@/components/app/app-link';
import { PageHeader } from '@/components/app/app-shell';

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
      <section className="rounded-2xl border border-[#e0d8cb] bg-[#fcfbf8] px-4 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
          Evidence boundary
        </p>
        <p className="mt-1 text-[13px] leading-5 text-[#52626c]">
          The imported Home Assistant archive contains meter and equipment
          statistics, but no invoices, paid maintenance records or verified
          benefit valuations. Oriel therefore cannot calculate a paid-to-
          received ratio yet.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-[#173850] px-3 py-3 text-white">
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-white/55">
              Verified paid
            </p>
            <p className="mt-1 text-[1.3rem] font-semibold tracking-[-0.045em] tabular-nums">
              £0.00
            </p>
          </div>
          <div className="rounded-xl bg-[#f7f3ec] px-3 py-3 text-[#153044]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#8f7040]">
              Verified received
            </p>
            <p className="mt-1 text-[1.3rem] font-semibold tracking-[-0.045em] tabular-nums">
              £0.00
            </p>
          </div>
        </div>
        <p className="mt-3 text-[12px] leading-5 text-[#6b777f]">
          These values remain zero until their supporting evidence is imported,
          while the physical evidence remains available in{' '}
          <AppLink href="/app/systems" className="font-medium text-[#815f2c] underline">
            Systems
          </AppLink>
          .
        </p>
      </section>
    </div>
  );
}
