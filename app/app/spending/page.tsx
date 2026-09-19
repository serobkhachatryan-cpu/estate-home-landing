import { AppLink } from '@/components/app/app-link';
import { PageHeader } from '@/components/app/app-shell';

/**
 * The imported archive is physical telemetry only. Financial inputs stay at
 * zero until an invoice or receipt is deliberately added in a later import.
 */
export default function SpendingPage() {
  return (
    <div>
      <PageHeader
        title="Financial records"
        description="No invoices, bills, or approved budgets were included in the recorded Home Assistant snapshot."
      />

      <section className="rounded-2xl border border-[#e0d8cb] bg-[#fcfbf8] px-4 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
          Evidence boundary
        </p>
        <p className="mt-1 text-[12px] leading-5 text-[#52626c]">
          The Home Assistant archive contains meter and equipment measurements,
          not invoices or approved budget plans. Values below are deliberately
          zero rather than estimates. Physical evidence remains available in{' '}
          <AppLink href="/app/systems" className="font-medium text-[#815f2c] underline">
            Systems
          </AppLink>
          .
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-[#173850] px-3 py-3 text-white">
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-white/55">
              Verified spend
            </p>
            <p className="mt-1 text-[1.35rem] font-semibold tracking-[-0.045em] tabular-nums">
              £0.00
            </p>
          </div>
          <div className="rounded-xl bg-[#f7f3ec] px-3 py-3 text-[#153044]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#8f7040]">
              Invoice records
            </p>
            <p className="mt-1 text-[1.35rem] font-semibold tracking-[-0.045em] tabular-nums">
              0
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
