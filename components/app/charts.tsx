'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { formatPounds } from '@/lib/fixtures/spending';
import type { DaySpend } from '@/lib/fixtures/overview';
import type { SpendSeriesPoint } from '@/lib/fixtures/spending';

const weekConfig = {
  electricity: { label: 'Electricity', color: '#173850' },
  heating: { label: 'Heating fuel', color: '#a88348' },
  maintenance: { label: 'Maintenance', color: '#6d7f6a' },
} satisfies ChartConfig;

const spendConfig = {
  electricity: { label: 'Electricity', color: '#173850' },
  heating: { label: 'Heating fuel', color: '#a88348' },
  standby: { label: 'Standby', color: '#7d8a74' },
  water: { label: 'Water', color: '#4f6f8f' },
  maintenance: { label: 'Maintenance', color: '#8a6a4e' },
} satisfies ChartConfig;

export function WeekSpendChart({ data }: { data: DaySpend[] }) {
  return (
    <ChartContainer config={weekConfig} className="aspect-[2/1] w-full">
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#e4ddd2" />
        <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={40}
          tickFormatter={(value) => `£${value}`}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <span>
                  {weekConfig[name as keyof typeof weekConfig]?.label ?? name}:{' '}
                  {formatPounds(Number(value))}
                </span>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="electricity"
          stackId="a"
          fill="var(--color-electricity)"
          radius={0}
        />
        <Bar
          dataKey="heating"
          stackId="a"
          fill="var(--color-heating)"
          radius={0}
        />
        <Bar
          dataKey="maintenance"
          stackId="a"
          fill="var(--color-maintenance)"
          radius={0}
        />
      </BarChart>
    </ChartContainer>
  );
}

export function SpendingTrendChart({ data }: { data: SpendSeriesPoint[] }) {
  return (
    <ChartContainer config={spendConfig} className="aspect-[16/7] w-full">
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#e4ddd2" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={48}
          tickFormatter={(value) => `£${value}`}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <span>
                  {spendConfig[name as keyof typeof spendConfig]?.label ?? name}
                  : {formatPounds(Number(value))}
                </span>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Area
          type="monotone"
          dataKey="electricity"
          stackId="1"
          stroke="var(--color-electricity)"
          fill="var(--color-electricity)"
          fillOpacity={0.25}
        />
        <Area
          type="monotone"
          dataKey="heating"
          stackId="1"
          stroke="var(--color-heating)"
          fill="var(--color-heating)"
          fillOpacity={0.25}
        />
        <Area
          type="monotone"
          dataKey="standby"
          stackId="1"
          stroke="var(--color-standby)"
          fill="var(--color-standby)"
          fillOpacity={0.25}
        />
        <Area
          type="monotone"
          dataKey="water"
          stackId="1"
          stroke="var(--color-water)"
          fill="var(--color-water)"
          fillOpacity={0.25}
        />
        <Area
          type="monotone"
          dataKey="maintenance"
          stackId="1"
          stroke="var(--color-maintenance)"
          fill="var(--color-maintenance)"
          fillOpacity={0.25}
        />
      </AreaChart>
    </ChartContainer>
  );
}

export function SystemPatternChart({
  data,
  unit,
}: {
  data: { label: string; value: number }[];
  unit: string;
}) {
  const config = {
    value: { label: unit, color: '#173850' },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="aspect-[16/7] w-full">
      <LineChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#e4ddd2" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} width={36} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          type="monotone"
          dataKey="value"
          stroke="var(--color-value)"
          strokeWidth={2}
          dot={{ r: 3, fill: '#173850' }}
        />
      </LineChart>
    </ChartContainer>
  );
}
