'use client';

import { AppLink } from '@/components/app/app-link';
import { useState } from 'react';
import { PageHeader } from '@/components/app/app-shell';
import { StatusBadge } from '@/components/app/status-badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { UtilityDetail } from '@/lib/fixtures/utilities';

export function UtilityDetailPage({ detail }: { detail: UtilityDetail }) {
  const [resolved, setResolved] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div>
      <PageHeader
        eyebrow={detail.name}
        title={detail.name}
        description={detail.plainStory}
        actions={
          <StatusBadge
            state={detail.status === 'ok' || resolved ? 'normal' : 'attention'}
            label={resolved ? 'Reviewed in demo' : detail.statusLabel}
          />
        }
      />

      <div className="mb-8 grid gap-3 md:grid-cols-2">
        <article className="border border-[#d8d0c3] bg-[#fcfbf8] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8f7040]">
            Paid
          </p>
          <p className="mt-3 font-serif text-4xl tracking-[-0.04em] text-[#153044]">
            {detail.spent}
          </p>
        </article>
        <article className="border border-[#d8d0c3] bg-[#fcfbf8] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8f7040]">
            Received
          </p>
          <p className="mt-3 text-lg font-medium leading-7 text-[#243a48]">
            {detail.benefit}
          </p>
        </article>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8f7040]">
          In context
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {detail.readings.map((reading) => (
            <div
              key={reading.label}
              className="border border-[#d8d0c3] bg-[#fcfbf8] p-4"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8f7040]">
                {reading.label}
              </p>
              <p className="mt-2 font-serif text-2xl tracking-[-0.03em] text-[#153044]">
                {reading.value}
              </p>
              <p className="mt-1 text-xs leading-5 text-[#6b777f]">
                {reading.context}
              </p>
            </div>
          ))}
        </div>
      </section>

      {detail.exception && !resolved ? (
        <section className="mb-8 border border-[#e0c4b0] bg-[#fdf8f5] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
            Exception
          </p>
          <h3 className="mt-2 text-xl font-medium text-[#153044]">
            {detail.exception.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#52626c]">
            {detail.exception.detail}
          </p>
          <p className="mt-3 text-sm leading-6 text-[#243a48]">
            {detail.exception.nextStep}
          </p>
          <Button
            className="mt-4 h-9 rounded-full bg-[#173850] hover:bg-[#0d283b]"
            onClick={() => setConfirmOpen(true)}
          >
            Mark reviewed (demo)
          </Button>
        </section>
      ) : null}

      <p className="mb-6 text-sm leading-6 text-[#6b777f]">
        {detail.whatWeAreNotDoing}
      </p>

      <AppLink
        href="/app"
        className="text-sm font-medium text-[#815f2c] underline"
      >
        Back to home summary
      </AppLink>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="border-[#d4cdbf] bg-[#f9f6ef] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl tracking-[-0.03em]">
              Confirm demo review?
            </DialogTitle>
            <DialogDescription className="text-[15px] leading-6 text-[#52626c]">
              Prototype only. Nothing is sent to a contractor or device.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-full border-[#cfc5b4]"
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-full bg-[#173850] hover:bg-[#0d283b]"
              onClick={() => {
                setResolved(true);
                setConfirmOpen(false);
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
