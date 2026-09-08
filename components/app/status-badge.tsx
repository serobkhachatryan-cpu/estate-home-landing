import type { ConditionState } from '@/lib/fixtures/types';
import { cn } from '@/lib/utils';

const styles: Record<ConditionState, string> = {
  normal: 'border-[#c5d4c0] bg-[#eef4ea] text-[#2f4a34]',
  watch: 'border-[#e0d2a8] bg-[#f7f1e0] text-[#6d5a2c]',
  attention: 'border-[#e0c4b0] bg-[#f7ebe4] text-[#6d3f2c]',
  offline: 'border-[#d2ccc2] bg-[#f0ebe3] text-[#5a6270]',
};

const labels: Record<ConditionState, string> = {
  normal: 'Normal',
  watch: 'Watching',
  attention: 'Needs review',
  offline: 'Offline',
};

export function StatusBadge({
  state,
  label,
  className,
}: {
  state: ConditionState;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.04em]',
        styles[state],
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'size-1.5 rounded-full',
          state === 'normal' && 'bg-[#4d7a52]',
          state === 'watch' && 'bg-[#a88348]',
          state === 'attention' && 'bg-[#a86648]',
          state === 'offline' && 'bg-[#7a817d]',
        )}
      />
      {label ?? labels[state]}
    </span>
  );
}
