import { cn } from '@/lib/utils';
import {
  formatSpend,
  formatSpendDelta,
  varianceAgainstPlan,
  type SpendHeadline,
  type SpendVariance,
} from '@/lib/fixtures/spend-tree';

function varianceTone(variance: SpendVariance) {
  if (variance === 'over') return 'text-[#8a4b3a]';
  if (variance === 'under') return 'text-[#4f6f4a]';
  return 'text-[#5a6a73]';
}

export function PlanFactForecast({
  headline,
  className,
}: {
  headline: SpendHeadline;
  className?: string;
}) {
  const variance = varianceAgainstPlan(headline.fact, headline.plan);

  return (
    <section
      aria-label="Plan, fact and forecast"
      className={cn(
        'grid grid-cols-3 gap-2 border border-[#d8d0c3] bg-[#fcfbf8] p-3 sm:gap-3 sm:p-5',
        className,
      )}
    >
      <Metric
        label="Plan"
        value={formatSpend(headline.plan)}
        hint={headline.periodLabel}
      />
      <Metric
        label="Fact"
        value={formatSpend(headline.fact, 2)}
        hint={formatSpendDelta(headline.fact, headline.plan)}
        hintClassName={varianceTone(variance)}
        emphasize
      />
      <Metric
        label="Forecast"
        value={formatSpend(headline.forecast)}
        hint="Expected close"
      />
    </section>
  );
}

function Metric({
  label,
  value,
  hint,
  hintClassName,
  emphasize,
}: {
  label: string;
  value: string;
  hint: string;
  hintClassName?: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={cn(
        'min-w-0 border border-transparent px-0.5 py-0.5 sm:px-1 sm:py-1',
        emphasize &&
          'border-[#e0d2a8] bg-[#f7f1e0] px-1.5 py-1.5 sm:px-4 sm:py-3',
      )}
    >
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#8f7040] sm:text-[10px] sm:tracking-[0.16em]">
        {label}
      </p>
      <p className="mt-1 truncate font-serif text-lg tracking-[-0.04em] text-[#153044] sm:mt-2 sm:text-4xl">
        {value}
      </p>
      <p
        className={cn(
          'mt-1 line-clamp-2 text-[10px] leading-4 text-[#5a6a73] sm:mt-2 sm:text-sm sm:leading-5',
          hintClassName,
        )}
      >
        {hint}
      </p>
    </div>
  );
}
