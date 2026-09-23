'use client';

import { useEffect, useState } from 'react';
import { ImportedSystemsWorkspace } from '@/components/app/imported-systems-workspace';

type AccessState =
  | { phase: 'loading' }
  | { phase: 'missing' }
  | { phase: 'ready'; token: string };

function readShareToken() {
  const value = window.location.hash.replace(/^#/, '').trim();
  return /^[A-Za-z0-9_-]{32,128}$/.test(value) ? value : null;
}

/**
 * The secret portion of an investor link lives in the fragment, which the
 * browser does not send when requesting /investor. Only the authenticated
 * history calls receive it in an Authorization header.
 */
export function InvestorHistoryWorkspace() {
  const [access, setAccess] = useState<AccessState>({ phase: 'loading' });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const token = readShareToken();
      setAccess(token ? { phase: 'ready', token } : { phase: 'missing' });
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-dvh bg-[#ebe4d8] px-0 text-[#102030] sm:px-4 sm:py-6">
      <main className="mx-auto min-h-dvh w-full max-w-[520px] bg-[#f5f1e9] px-4 pb-10 pt-5 shadow-[0_0_0_1px_rgba(16,32,48,0.06)] sm:min-h-0 sm:rounded-[2rem] sm:px-6 sm:py-7">
        <header className="border-b border-[#e0d8cb] pb-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] font-semibold tracking-[-0.01em] text-[#153044]">
              Oriel
            </p>
            <span className="rounded-full bg-[#e7efe3] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#2f4a34]">
              Investor · read only
            </span>
          </div>
          <h1 className="mt-5 text-[1.9rem] font-semibold leading-none tracking-[-0.05em] text-[#153044]">
            Recorded home systems
          </h1>
          <p className="mt-2 text-[14px] leading-5 text-[#52626c]">
            Historical Home Assistant statistics through 19 Sept 2026. Current
            states, when available, are separately marked as live telemetry;
            values without a complete historical record are shown as zero.
          </p>
        </header>

        <div className="pt-5">
          {access.phase === 'loading' ? (
            <p className="text-[13px] text-[#6b777f]">Opening investor view…</p>
          ) : access.phase === 'missing' ? (
            <section className="rounded-2xl border border-[#e0d8cb] bg-[#fcfbf8] px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
                Access link required
              </p>
              <p className="mt-1 text-[13px] leading-5 text-[#52626c]">
                This view needs the complete investor link supplied by Oriel.
                Please reopen the link exactly as it was shared.
              </p>
            </section>
          ) : (
            <ImportedSystemsWorkspace
              historyEndpoint="/api/investor/sensor-history"
              liveEndpoint="/api/investor/live-sensors"
              accessToken={access.token}
            />
          )}
        </div>

        <footer className="mt-8 border-t border-[#e0d8cb] pt-4 text-[11px] leading-5 text-[#6b777f]">
          Read-only view. It contains normalized daily measurements and, when
          the owner enables it, an allowlisted current-state snapshot. No Home
          Assistant access, credentials, recordings, or controls are available
          here.
        </footer>
      </main>
    </div>
  );
}
