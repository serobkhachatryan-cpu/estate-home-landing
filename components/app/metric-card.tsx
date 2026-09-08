import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MetricCard({
  label,
  value,
  comparison,
  explanation,
  className,
}: {
  label: string;
  value: string;
  comparison: string;
  explanation: string;
  className?: string;
}) {
  return (
    <article
      className={cn(
        'border border-[#d8d0c3] bg-[#fcfbf8] p-4 shadow-[0_10px_30px_rgba(31,43,52,0.04)]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8f7040]">
          {label}
        </p>
        <span className="group relative">
          <Info
            className="size-3.5 text-[#9aa3aa]"
            strokeWidth={1.5}
            aria-hidden
          />
          <span className="sr-only">{explanation}</span>
          <span
            role="tooltip"
            className="pointer-events-none absolute right-0 top-5 z-10 w-56 border border-[#d8d0c3] bg-[#fffdf8] p-3 text-xs leading-5 text-[#52626c] opacity-0 shadow-md transition group-hover:opacity-100 group-focus-within:opacity-100"
          >
            {explanation}
          </span>
        </span>
      </div>
      <p className="mt-3 font-serif text-3xl tracking-[-0.04em] text-[#153044]">
        {value}
      </p>
      <p className="mt-2 text-sm leading-5 text-[#5a6a73]">{comparison}</p>
    </article>
  );
}
