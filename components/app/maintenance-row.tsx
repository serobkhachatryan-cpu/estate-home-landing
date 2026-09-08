import type { ReactNode } from 'react';
import type { MaintenanceItem } from '@/lib/fixtures/maintenance';
import { cn } from '@/lib/utils';

const statusStyles: Record<MaintenanceItem['status'], string> = {
  scheduled: 'text-[#2f4a34] bg-[#eef4ea] border-[#c5d4c0]',
  monitoring: 'text-[#6d5a2c] bg-[#f7f1e0] border-[#e0d2a8]',
  quoted: 'text-[#6d3f2c] bg-[#f7ebe4] border-[#e0c4b0]',
  completed: 'text-[#3f4a52] bg-[#eef1f3] border-[#d2d7db]',
  deferred: 'text-[#5a6270] bg-[#f0ebe3] border-[#d2ccc2]',
};

export function MaintenanceRow({
  item,
  action,
  className,
}: {
  item: MaintenanceItem;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        'grid gap-4 border border-[#d8d0c3] bg-[#fcfbf8] p-5 md:grid-cols-[1fr_auto]',
        className,
      )}
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-medium tracking-[-0.02em] text-[#153044]">
            {item.title}
          </h3>
          <span
            className={cn(
              'inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]',
              statusStyles[item.status],
            )}
          >
            {item.status}
          </span>
        </div>
        <p className="mt-2 text-sm text-[#5a6a73]">{item.when}</p>
        <p className="mt-2 text-sm leading-6 text-[#52626c]">{item.context}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#6b777f]">
          <span>
            Responsible:{' '}
            <strong className="font-semibold text-[#243a48]">
              {item.responsibility}
            </strong>
          </span>
          {item.cost ? (
            <span>
              Cost:{' '}
              <strong className="font-semibold text-[#243a48]">
                {item.cost}
              </strong>
            </span>
          ) : null}
        </div>
      </div>
      {action ? (
        <div className="flex items-start md:justify-end">{action}</div>
      ) : null}
    </article>
  );
}
