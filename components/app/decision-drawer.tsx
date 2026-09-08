'use client';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { DecisionItem } from '@/lib/fixtures/overview';

export function DecisionDrawer({
  decision,
  open,
  onOpenChange,
  onConfirm,
  onDefer,
}: {
  decision: DecisionItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onDefer: () => void;
}) {
  if (!decision) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full border-l border-[#d4cdbf] bg-[#f9f6ef] sm:max-w-md"
      >
        <SheetHeader className="border-b border-[#e0d8cb] pr-10 text-left">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8f7040]">
            {decision.demoLabel}
          </p>
          <SheetTitle className="font-serif text-2xl tracking-[-0.03em] text-[#153044]">
            {decision.title}
          </SheetTitle>
          <SheetDescription className="text-[15px] leading-6 text-[#52626c]">
            {decision.detail}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4">
          <div className="border border-[#e0d8cb] bg-[#fcfbf8] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
              Impact
            </p>
            <p className="mt-2 text-sm text-[#243a48]">{decision.impact}</p>
          </div>
          <p className="text-xs leading-5 text-[#6b777f]">
            This is a prototype confirmation. No contractor is contacted and no
            device setting changes in the real world.
          </p>
        </div>
        <SheetFooter className="border-t border-[#e0d8cb] sm:flex-row">
          <Button
            variant="outline"
            className="h-10 flex-1 rounded-full border-[#cfc5b4] bg-transparent"
            onClick={onDefer}
          >
            {decision.deferLabel}
          </Button>
          <Button
            className="h-10 flex-1 rounded-full bg-[#173850] hover:bg-[#0d283b]"
            onClick={onConfirm}
          >
            {decision.confirmLabel}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
