'use client';

import { useState } from 'react';
import { SystemPatternChart } from '@/components/app/charts';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useAppState } from '@/lib/app-state';
import type { SystemDetail } from '@/lib/fixtures/systems';

export function SystemDetailDrawer({
  system,
  open,
  onOpenChange,
}: {
  system: SystemDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { automationRequests, requestAutomationChange } = useAppState();
  const [pendingAutomation, setPendingAutomation] = useState<string | null>(
    null,
  );

  if (!system) return null;

  const pending = system.automations.find(
    (item) => item.id === pendingAutomation,
  );

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto border-l border-[#d4cdbf] bg-[#f9f6ef] sm:max-w-lg"
        >
          <SheetHeader className="border-b border-[#e0d8cb] pr-10 text-left">
            <div className="flex items-center gap-3">
              <StatusBadge
                state={system.condition}
                label={system.conditionLabel}
              />
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8f7040]">
                Demo property
              </p>
            </div>
            <SheetTitle className="font-serif text-3xl tracking-[-0.03em] text-[#153044]">
              {system.name}
            </SheetTitle>
            <SheetDescription className="text-[15px] leading-6 text-[#52626c]">
              {system.summary}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 px-4 pb-8">
            <section>
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8f7040]">
                What Oriel is watching
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#52626c]">
                {system.watching}
              </p>
              <p className="mt-2 text-xs text-[#6b777f]">
                {system.lastVerified}
              </p>
            </section>

            <section className="grid gap-3 sm:grid-cols-3">
              {system.readings.map((reading) => (
                <div
                  key={reading.label}
                  className="border border-[#e0d8cb] bg-[#fcfbf8] p-3"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8f7040]">
                    {reading.label}
                  </p>
                  <p className="mt-2 font-serif text-2xl tracking-[-0.03em] text-[#153044]">
                    {reading.value}
                  </p>
                  <p className="mt-1 text-xs text-[#6b777f]">{reading.note}</p>
                </div>
              ))}
            </section>

            <section>
              <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8f7040]">
                Recent pattern
              </h3>
              <div className="border border-[#e0d8cb] bg-[#fcfbf8] p-3">
                <SystemPatternChart
                  data={system.pattern}
                  unit={
                    system.id === 'climate'
                      ? '°C'
                      : system.id === 'water'
                        ? 'Flow index'
                        : 'Reading'
                  }
                />
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8f7040]">
                Thresholds
              </h3>
              <ul className="divide-y divide-[#e0d8cb] border border-[#e0d8cb] bg-[#fcfbf8]">
                {system.thresholds.map((threshold) => (
                  <li
                    key={threshold.label}
                    className="flex items-start justify-between gap-4 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#243a48]">
                        {threshold.label}
                      </p>
                      <p className="mt-1 text-xs text-[#6b777f]">
                        {threshold.value}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-[#815f2c]">
                      {threshold.status}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="border border-[#e0d8cb] bg-[#fcfbf8] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8f7040]">
                Next planned maintenance
              </p>
              <p className="mt-2 text-sm font-medium text-[#243a48]">
                {system.nextMaintenance.title}
              </p>
              <p className="mt-1 text-xs text-[#6b777f]">
                {system.nextMaintenance.when} · {system.nextMaintenance.owner}
              </p>
            </section>

            <section>
              <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8f7040]">
                Automations
              </h3>
              <ul className="space-y-3">
                {system.automations.map((automation) => {
                  const requested =
                    automationRequests[automation.id] === 'requested';
                  return (
                    <li
                      key={automation.id}
                      className="border border-[#e0d8cb] bg-[#fcfbf8] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-[#243a48]">
                            {automation.title}
                          </p>
                          <p className="mt-1 text-sm leading-5 text-[#52626c]">
                            {automation.detail}
                          </p>
                        </div>
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8f7040]">
                          {requested ? 'Requested' : automation.state}
                        </span>
                      </div>
                      {automation.state === 'Request a change' && !requested ? (
                        <Button
                          className="mt-3 h-9 rounded-full bg-[#173850] hover:bg-[#0d283b]"
                          onClick={() => setPendingAutomation(automation.id)}
                        >
                          Request a change
                        </Button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog
        open={Boolean(pending)}
        onOpenChange={(next) => {
          if (!next) setPendingAutomation(null);
        }}
      >
        <DialogContent className="border-[#d4cdbf] bg-[#f9f6ef] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl tracking-[-0.03em]">
              Confirm change request
            </DialogTitle>
            <DialogDescription className="text-[15px] leading-6 text-[#52626c]">
              {pending
                ? `Request “${pending.title}” as a demo action. No live system will be altered.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-full border-[#cfc5b4]"
              onClick={() => setPendingAutomation(null)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-full bg-[#173850] hover:bg-[#0d283b]"
              onClick={() => {
                if (pendingAutomation)
                  requestAutomationChange(pendingAutomation);
                setPendingAutomation(null);
              }}
            >
              Confirm request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
