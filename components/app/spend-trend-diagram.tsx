'use client';

import { useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  buildSpendSeries,
  seriesSummary,
  spendDiagramRanges,
  type SpendDiagramRange,
} from '@/lib/fixtures/spend-series';
import { formatSpend } from '@/lib/fixtures/spend-tree';
import { cn } from '@/lib/utils';

const chartConfig = {
  actual: { label: 'Fact', color: '#173850' },
  predicted: { label: 'Prediction', color: '#a88348' },
  plan: { label: 'Plan pace', color: '#9aa3aa' },
} satisfies ChartConfig;

type DiagramSubject = {
  id: string;
  name: string;
  plan: number;
  fact: number;
  forecast: number;
};

export function SpendTrendDiagram({
  subject,
  className,
  defaultRange = 'monthly',
}: {
  subject: DiagramSubject;
  className?: string;
  defaultRange?: SpendDiagramRange;
}) {
  const [range, setRange] = useState<SpendDiagramRange>(defaultRange);
  const series = buildSpendSeries(subject, range);
  const summary = seriesSummary(series);
  const rangeMeta = spendDiagramRanges.find((item) => item.id === range);
  const forecastStart = series.find((point) => point.kind === 'forecast')?.label;

  return (
    <section
      aria-label={`${subject.name} spend diagram`}
      className={cn('border border-[#d8d0c3] bg-[#fcfbf8]', className)}
    >
      <div className="flex flex-col gap-4 border-b border-[#d8d0c3] px-4 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8f7040]">
            Diagram · {subject.name}
          </p>
          <p className="mt-1 text-sm text-[#52626c]">
            {rangeMeta?.hint}. Solid = fact, dashed gold = prediction, grey =
            plan pace.
          </p>
        </div>
        <div
          role="tablist"
          aria-label="Time range"
          className="flex flex-wrap gap-1"
        >
          {spendDiagramRanges.map((item) => {
            const active = item.id === range;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setRange(item.id)}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold tracking-[0.04em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a88348]/50',
                  active
                    ? 'bg-[#173850] text-white'
                    : 'border border-[#d4cdbf] bg-[#f5f1e9] text-[#3a4b56] hover:border-[#c3ad85]',
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 border-b border-[#ebe4d8] px-4 py-3 sm:grid-cols-3">
        <MiniStat
          label="History in view"
          value={formatSpend(summary.actualTotal)}
          hint={`${summary.historyBuckets} buckets · fact`}
        />
        <MiniStat
          label="Prediction ahead"
          value={formatSpend(summary.predictedTotal)}
          hint={`${summary.forecastBuckets} buckets · model`}
        />
        <MiniStat
          label="Plan pace in view"
          value={formatSpend(summary.planTotal)}
          hint="Reference if plan were even"
        />
      </div>

      <div className="px-2 pb-2 pt-4 sm:px-4">
        <ChartContainer config={chartConfig} className="aspect-[16/7] w-full">
          <LineChart
            data={series}
            margin={{ left: 4, right: 12, top: 8, bottom: 0 }}
          >
            <CartesianGrid vertical={false} stroke="#e4ddd2" />
            {forecastStart ? (
              <ReferenceArea
                x1={forecastStart}
                x2={series[series.length - 1]?.label}
                fill="#f7f1e0"
                fillOpacity={0.55}
                ifOverflow="extendDomain"
              />
            ) : null}
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval="preserveStartEnd"
              minTickGap={18}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={52}
              tickFormatter={(value) =>
                value >= 1000 ? `£${Math.round(value / 1000)}k` : `£${value}`
              }
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <span>
                      {chartConfig[name as keyof typeof chartConfig]?.label ??
                        name}
                      : {formatSpend(Number(value), Number(value) < 100 ? 2 : 0)}
                    </span>
                  )}
                />
              }
            />
            <Legend
              verticalAlign="top"
              height={28}
              formatter={(value) =>
                chartConfig[value as keyof typeof chartConfig]?.label ?? value
              }
            />
            <Line
              type="monotone"
              dataKey="plan"
              stroke="var(--color-plan)"
              strokeWidth={1.5}
              strokeDasharray="2 4"
              dot={false}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="var(--color-actual)"
              strokeWidth={2.25}
              dot={{ r: 2.5, fill: '#173850', strokeWidth: 0 }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="var(--color-predicted)"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={{ r: 2.5, fill: '#a88348', strokeWidth: 0 }}
              connectNulls
            />
          </LineChart>
        </ChartContainer>
      </div>

      <p className="border-t border-[#ebe4d8] px-4 py-3 text-xs leading-5 text-[#6b777f]">
        Illustrative demo series for {subject.name}. Prediction is not a
        guarantee — it leans from recent fact toward the period forecast
        (£{Math.round(subject.forecast).toLocaleString('en-GB')}).
      </p>
    </section>
  );
}

function MiniStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9aa3aa]">
        {label}
      </p>
      <p className="mt-1 font-serif text-xl tracking-[-0.03em] text-[#153044]">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-[#6b777f]">{hint}</p>
    </div>
  );
}
