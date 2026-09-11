import { AppLink } from '@/components/app/app-link';
import {
  formatSpend,
  varianceAgainstPlan,
  type SpendParameter,
} from '@/lib/fixtures/spend-tree';
import { cn } from '@/lib/utils';

/** Short labels so the drum fits a phone without wrapping. */
const shortNames: Record<string, string> = {
  occupancy: 'Occupancy',
  staff: 'Staff',
  utilities: 'Utilities',
  transportation: 'Transport',
  renovation: 'Renov.',
  inventory: 'Inventory',
  insurance: 'Insurance',
  livestock: 'Livestock',
};

function compactPounds(value: number): string {
  if (Math.abs(value) >= 1000) {
    const thousands = value / 1000;
    const digits = Number.isInteger(thousands) ? 0 : 1;
    return `£${thousands.toFixed(digits)}k`;
  }
  return formatSpend(value);
}

export function SpendParameterStrip({
  parameters,
  activeId,
  compact,
}: {
  parameters: SpendParameter[];
  activeId?: string;
  compact?: boolean;
}) {
  return (
    <nav aria-label="Spend parameters" className="w-full">
      <div
        className={cn(
          // Narrow drum: ~3.2 chips visible on a 390px phone, with a peek of the next.
          'flex gap-1.5 overflow-x-auto overscroll-x-contain pb-1 snap-x snap-mandatory',
          '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          'sm:gap-2',
          compact ? '' : '',
        )}
      >
        {parameters.map((parameter) => {
          const active = activeId === parameter.id;
          const variance = varianceAgainstPlan(parameter.fact, parameter.plan);
          const label = shortNames[parameter.id] ?? parameter.name;

          return (
            <AppLink
              key={parameter.id}
              href={`/app/spending/${parameter.id}`}
              title={`${parameter.name} · Fact ${formatSpend(parameter.fact)} · Plan ${formatSpend(parameter.plan)}`}
              className={cn(
                'w-[28%] max-w-[6.75rem] min-w-[5.25rem] shrink-0 snap-start rounded-2xl border px-2 py-2 transition',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a88348]/50',
                'sm:w-auto sm:max-w-none sm:min-w-[7rem] sm:px-3 sm:py-2.5',
                active
                  ? 'border-[#173850] bg-[#173850] text-white'
                  : 'border-[#d8d0c3] bg-[#fcfbf8] text-[#153044] hover:border-[#c3ad85]',
              )}
            >
              <span
                className={cn(
                  'block truncate text-[9px] font-semibold uppercase tracking-[0.12em] sm:text-[10px] sm:tracking-[0.14em]',
                  active ? 'text-[#d9b779]' : 'text-[#8f7040]',
                )}
              >
                {label}
              </span>
              <span className="mt-1.5 block text-base font-semibold tracking-[-0.04em] tabular-nums sm:mt-2 sm:text-xl">
                <span className="sm:hidden">{compactPounds(parameter.fact)}</span>
                <span className="hidden sm:inline">
                  {formatSpend(parameter.fact)}
                </span>
              </span>
              <span
                className={cn(
                  'mt-0.5 block truncate text-[10px] sm:mt-1 sm:text-[11px]',
                  active
                    ? 'text-white/70'
                    : variance === 'over'
                      ? 'text-[#8a4b3a]'
                      : 'text-[#6b777f]',
                )}
              >
                <span className="sm:hidden">
                  P {compactPounds(parameter.plan)}
                </span>
                <span className="hidden sm:inline">
                  Plan {formatSpend(parameter.plan)}
                </span>
              </span>
            </AppLink>
          );
        })}
      </div>
    </nav>
  );
}

export function SpendParameterTable({
  parameters,
}: {
  parameters: SpendParameter[];
}) {
  return (
    <div className="overflow-x-auto border border-[#d8d0c3] bg-[#fcfbf8]">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[#d8d0c3] text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
            <th className="px-4 py-3 font-semibold">Parameter</th>
            <th className="px-4 py-3 font-semibold">Plan</th>
            <th className="px-4 py-3 font-semibold">Fact</th>
            <th className="px-4 py-3 font-semibold">Forecast</th>
            <th className="px-4 py-3 font-semibold">Subs</th>
          </tr>
        </thead>
        <tbody>
          {parameters.map((parameter) => {
            const variance = varianceAgainstPlan(parameter.fact, parameter.plan);
            return (
              <tr
                key={parameter.id}
                className="border-b border-[#ebe4d8] last:border-0"
              >
                <td className="px-4 py-3">
                  <AppLink
                    href={`/app/spending/${parameter.id}`}
                    className="font-medium text-[#153044] underline-offset-2 hover:underline"
                  >
                    {parameter.name}
                  </AppLink>
                  <p className="mt-1 max-w-xs text-xs leading-5 text-[#6b777f]">
                    {parameter.blurb}
                  </p>
                </td>
                <td className="px-4 py-3 text-[#52626c]">
                  {formatSpend(parameter.plan)}
                </td>
                <td
                  className={cn(
                    'px-4 py-3 font-medium',
                    variance === 'over' ? 'text-[#8a4b3a]' : 'text-[#153044]',
                  )}
                >
                  {formatSpend(parameter.fact, parameter.fact % 1 ? 2 : 0)}
                </td>
                <td className="px-4 py-3 text-[#52626c]">
                  {formatSpend(parameter.forecast)}
                </td>
                <td className="px-4 py-3 text-[#6b777f]">
                  {parameter.subparameters?.length ?? 0}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
