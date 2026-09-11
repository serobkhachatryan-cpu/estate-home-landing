import { AppLink } from '@/components/app/app-link';
import {
  formatSpend,
  varianceAgainstPlan,
  type SpendParameter,
  type SpendSubparameter,
} from '@/lib/fixtures/spend-tree';
import { cn } from '@/lib/utils';

export function SubparameterList({
  parameter,
}: {
  parameter: SpendParameter;
}) {
  const items = parameter.subparameters ?? [];
  if (items.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
        Inside
      </p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <SubparameterRow
            key={item.id}
            parameterId={parameter.id}
            item={item}
          />
        ))}
      </ul>
    </div>
  );
}

function SubparameterRow({
  parameterId,
  item,
}: {
  parameterId: string;
  item: SpendSubparameter;
}) {
  const variance = varianceAgainstPlan(item.fact, item.plan);

  return (
    <li>
      <AppLink
        href={`/app/spending/${parameterId}/${item.id}`}
        className="flex items-center justify-between gap-3 rounded-2xl bg-[#fcfbf8] px-3.5 py-3"
      >
        <div className="min-w-0">
          <p className="truncate text-[14px] font-medium text-[#153044]">
            {item.name}
          </p>
          <p className="mt-0.5 text-[11px] text-[#6b777f]">
            Plan {formatSpend(item.plan)}
          </p>
        </div>
        <p
          className={cn(
            'shrink-0 text-[14px] font-semibold tabular-nums',
            variance === 'over' ? 'text-[#8a4b3a]' : 'text-[#153044]',
          )}
        >
          {formatSpend(item.fact, item.fact % 1 ? 2 : 0)}
        </p>
      </AppLink>
    </li>
  );
}
