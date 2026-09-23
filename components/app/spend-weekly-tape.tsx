'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  buildSpendWeeklyTape,
  defaultTapeFocusIndex,
  efficiencyLabel,
  formatWeekMoney,
  sumTrailing52,
  TAPE_SPAN_WEEKS,
  type SpendTapeSubject,
  type SpendTapeWeek,
  type WeekEfficiency,
} from '@/lib/fixtures/spend-tape';
import { cn } from '@/lib/utils';

const WEEK_HEIGHT = 36;
const VIEWPORT_HEIGHT = 268;
const BAR_TRACK = 148;

function efficiencyTone(efficiency: WeekEfficiency) {
  if (efficiency === 'efficient') return 'text-[#9dcea6]';
  if (efficiency === 'inefficient') return 'text-[#e2b7a4]';
  return 'text-[#d9b779]';
}

function efficiencyDot(efficiency: WeekEfficiency) {
  if (efficiency === 'efficient') return 'bg-[#9dcea6]';
  if (efficiency === 'inefficient') return 'bg-[#e2b7a4]';
  return 'bg-[#d9b779]';
}

function barWidth(value: number, max: number) {
  return Math.max(4, Math.round((value / max) * BAR_TRACK));
}

function indexFromScroll(
  scrollTop: number,
  clientHeight: number,
  edgePad: number,
  count: number,
) {
  const center = scrollTop + clientHeight / 2;
  const raw = Math.round((center - edgePad - WEEK_HEIGHT / 2) / WEEK_HEIGHT);
  return Math.max(0, Math.min(count - 1, raw));
}

function scrollTopForIndex(
  index: number,
  clientHeight: number,
  edgePad: number,
) {
  return Math.max(
    0,
    edgePad + index * WEEK_HEIGHT + WEEK_HEIGHT / 2 - clientHeight / 2,
  );
}

export function SpendWeeklyTape({
  subject,
  className,
}: {
  subject: SpendTapeSubject;
  className?: string;
}) {
  const weeks = useMemo(
    () => buildSpendWeeklyTape(subject),
    [subject.id, subject.name, subject.plan, subject.fact, subject.forecast],
  );
  const scrollerRef = useRef<HTMLDivElement>(null);
  const edgePadRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const nowIndex = weeks.findIndex((w) => w.offset === 0);
  const startIndex = defaultTapeFocusIndex(weeks);

  const [activeIndex, setActiveIndex] = useState(startIndex);
  const [edgePad, setEdgePad] = useState(100);
  const active = weeks[activeIndex] ?? weeks[startIndex] ?? weeks[0]!;

  const window52 = useMemo(
    () => sumTrailing52(weeks, activeIndex),
    [weeks, activeIndex],
  );

  const maxValue = Math.max(
    ...weeks.map((w) =>
      Math.max(w.plan, w.fact ?? 0, w.forecast ?? 0, w.cashflow ?? 0),
    ),
  );

  const syncFromScroll = useCallback(() => {
    const node = scrollerRef.current;
    if (!node) return;
    const next = indexFromScroll(
      node.scrollTop,
      node.clientHeight,
      edgePadRef.current,
      weeks.length,
    );
    setActiveIndex((prev) => (prev === next ? prev : next));
  }, [weeks.length]);

  const onScroll = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(syncFromScroll);
  }, [syncFromScroll]);

  const jumpToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      const node = scrollerRef.current;
      if (!node || index < 0) return;
      const clamped = Math.max(0, Math.min(weeks.length - 1, index));
      node.scrollTo({
        top: scrollTopForIndex(clamped, node.clientHeight, edgePadRef.current),
        behavior,
      });
      setActiveIndex(clamped);
    },
    [weeks.length],
  );

  useEffect(() => {
    setActiveIndex(defaultTapeFocusIndex(weeks));
  }, [subject.id, weeks]);

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;

    const measure = () => {
      const pad = Math.max(
        24,
        Math.round(node.clientHeight / 2 - WEEK_HEIGHT / 2),
      );
      edgePadRef.current = pad;
      setEdgePad(pad);
      node.scrollTop = scrollTopForIndex(activeIndex, node.clientHeight, pad);
    };

    measure();
    requestAnimationFrame(() => {
      jumpToIndex(defaultTapeFocusIndex(weeks), 'auto');
    });

    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => {
      ro.disconnect();
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject.id]);

  const isFuture = active.offset > 0;
  const weekPrimary = active.fact ?? active.forecast ?? 0;
  const weekDelta = weekPrimary - active.plan;
  const windowDelta = window52 ? window52.fact - window52.plan : 0;
  const windowEff = window52
    ? efficiencyForWindow(window52.fact, window52.plan)
    : 'on-plan';

  return (
    <section
      aria-label={`${subject.name} weekly tape`}
      className={cn(
        'overflow-hidden rounded-2xl bg-[#102030] text-[#f5f1e9]',
        className,
      )}
    >
      {/* Always-visible 52-week Plan / Fact — recalculates with yellow focus */}
      <div className="border-b border-white/10 px-4 pb-3 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d9b779]">
          {window52?.weekCount ?? 52} weeks to focus
          {window52 ? (
            <>
              <span className="mx-1.5 text-white/25">·</span>
              {window52.from.rangeLabel} → {window52.to.rangeLabel}
            </>
          ) : null}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Metric
            label="Plan · 52w"
            value={formatWeekMoney(window52?.plan ?? subject.plan)}
            emphasize
          />
          <Metric
            label={
              window52?.includesForecast
                ? 'Fact / forecast · 52w'
                : 'Fact · 52w'
            }
            value={formatWeekMoney(window52?.fact ?? subject.fact)}
            emphasize
          />
        </div>

        <div className="mt-2 flex items-center justify-between gap-3">
          <p
            className={cn(
              'text-[12px] font-semibold',
              efficiencyTone(windowEff),
            )}
          >
            {efficiencyLabel(windowEff)}
            <span className="ml-1.5 font-normal tabular-nums text-white/50">
              {windowDelta > 0 ? '+' : ''}
              {formatWeekMoney(windowDelta)} vs plan
            </span>
          </p>
        </div>
      </div>

      {/* Focused UK week — updates as the yellow line moves */}
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
              Focus week
              <span className="mx-1.5 text-white/25">·</span>
              {active.offset < 0
                ? `${Math.abs(active.offset)}w ago`
                : active.offset === 0
                  ? 'This week'
                  : `+${active.offset}w`}
              <span className="mx-1.5 text-white/25">·</span>W{active.isoWeek}
            </p>
            <p className="mt-1 text-[1.65rem] font-semibold leading-none tracking-[-0.05em] tabular-nums">
              {formatWeekMoney(weekPrimary)}
            </p>
            <p className="mt-1.5 text-[12px] leading-snug text-white/70">
              {active.calendarLabel}
            </p>
            <p className="mt-0.5 text-[10px] text-white/40">
              UK Mon–Sun · {active.weekStart} → {active.weekEnd}
            </p>
          </div>
          <div className="text-right">
            <p
              className={cn(
                'text-[12px] font-semibold',
                efficiencyTone(active.efficiency),
              )}
            >
              {efficiencyLabel(active.efficiency)}
            </p>
            <p className="mt-1 text-[11px] tabular-nums text-white/50">
              {weekDelta > 0 ? '+' : ''}
              {formatWeekMoney(weekDelta)}
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <Metric label="Week plan" value={formatWeekMoney(active.plan)} />
          <Metric
            label={isFuture ? 'Week forecast' : 'Week fact'}
            value={formatWeekMoney(weekPrimary)}
          />
          <Metric
            label="Cash"
            value={
              active.cashflow != null ? formatWeekMoney(active.cashflow) : '—'
            }
          />
        </div>
      </div>

      <div className="px-3 pb-1">
        <p className="mb-1 px-1 text-[9px] font-medium uppercase tracking-[0.12em] text-white/35">
          ±2 years · winter higher · events move 52w totals
        </p>
        <div className="relative">
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-px -translate-y-1/2 bg-[#d9b779]"
            aria-hidden
          />
          <div
            ref={scrollerRef}
            onScroll={onScroll}
            className={cn(
              'overflow-y-auto overscroll-y-contain touch-pan-y',
              'snap-y snap-mandatory',
              '[-webkit-overflow-scrolling:touch]',
              '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            )}
            style={{
              height: VIEWPORT_HEIGHT,
              WebkitOverflowScrolling: 'touch',
            }}
            role="listbox"
            aria-label={`${subject.name} weekly ribbon, UK Monday–Sunday weeks`}
            aria-activedescendant={active.id}
          >
            <div
              style={{
                height: edgePad * 2 + weeks.length * WEEK_HEIGHT,
                paddingTop: edgePad,
                paddingBottom: edgePad,
              }}
            >
              {weeks.map((week, index) => (
                <WeekRow
                  key={week.id}
                  week={week}
                  max={maxValue}
                  focused={index === activeIndex}
                  inWindow={
                    window52 != null &&
                    index >= activeIndex - (window52.weekCount - 1) &&
                    index <= activeIndex
                  }
                  onActivate={() => jumpToIndex(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1.5 border-t border-white/10 px-3 py-2">
        <TapeButton
          onClick={() =>
            jumpToIndex(weeks.findIndex((w) => w.offset === -TAPE_SPAN_WEEKS))
          }
        >
          −{TAPE_SPAN_WEEKS}
        </TapeButton>
        <TapeButton onClick={() => jumpToIndex(startIndex)}>Story</TapeButton>
        <TapeButton onClick={() => jumpToIndex(nowIndex)}>Now</TapeButton>
        <TapeButton
          onClick={() =>
            jumpToIndex(weeks.findIndex((w) => w.offset === TAPE_SPAN_WEEKS))
          }
        >
          +{TAPE_SPAN_WEEKS}
        </TapeButton>
      </div>

      {active.note ? (
        <p className="border-t border-white/10 px-4 py-3 text-[13px] leading-5 text-[#f5f1e9]/90">
          {active.note}
        </p>
      ) : null}
    </section>
  );
}

function efficiencyForWindow(fact: number, plan: number): WeekEfficiency {
  const ratio = fact / Math.max(plan, 1);
  if (ratio > 1.08) return 'inefficient';
  if (ratio < 0.95) return 'efficient';
  return 'on-plan';
}

function WeekRow({
  week,
  max,
  focused,
  inWindow,
  onActivate,
}: {
  week: SpendTapeWeek;
  max: number;
  focused: boolean;
  inWindow: boolean;
  onActivate: () => void;
}) {
  const primary = week.fact ?? week.forecast ?? 0;
  const secondary = week.cashflow;
  const primaryW = barWidth(primary, max);
  const planW = barWidth(week.plan, max);
  const cashW = secondary != null ? barWidth(secondary, max) : 0;
  const isFuture = week.offset > 0;
  const isNow = week.offset === 0;

  return (
    <button
      type="button"
      id={week.id}
      role="option"
      aria-selected={focused}
      aria-label={`${week.calendarLabel}: ${efficiencyLabel(week.efficiency)}`}
      onClick={onActivate}
      className={cn(
        'flex w-full snap-center items-center gap-2 px-1 focus-visible:outline-none',
        focused && 'bg-white/[0.07]',
        !focused && inWindow && 'bg-white/[0.03]',
        isNow && !focused && 'bg-[#d9b779]/10',
      )}
      style={{ height: WEEK_HEIGHT }}
    >
      <span className="w-[4.75rem] shrink-0 text-left leading-tight">
        <span
          className={cn(
            'block text-[10px] tabular-nums',
            focused
              ? 'font-semibold text-[#d9b779]'
              : isNow
                ? 'text-white/75'
                : inWindow
                  ? 'text-white/55'
                  : 'text-white/35',
          )}
        >
          {week.rangeLabel}
        </span>
        <span
          className={cn(
            'block text-[8px] tabular-nums',
            focused ? 'text-white/55' : 'text-white/30',
          )}
        >
          Mon–Sun · W{week.isoWeek}
        </span>
      </span>

      <span
        className="relative h-[14px] flex-1"
        style={{ maxWidth: BAR_TRACK + 24 }}
      >
        {week.note ? (
          <span
            className={cn(
              'absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full',
              efficiencyDot(week.efficiency),
            )}
            style={{ left: -6 }}
            aria-hidden
          />
        ) : null}

        <span
          className="absolute inset-y-0 left-0 rounded-sm bg-white/5"
          style={{ width: BAR_TRACK }}
          aria-hidden
        />

        <span
          className="absolute inset-y-0 w-px border-l border-dashed border-white/35"
          style={{ left: planW }}
          aria-hidden
        />

        {secondary != null ? (
          <span
            className="absolute top-[1px] h-[5px] rounded-sm bg-[#4f6f8f]"
            style={{ width: cashW, left: 0 }}
            aria-hidden
          />
        ) : null}

        <span
          className={cn(
            'absolute rounded-sm',
            secondary != null ? 'bottom-[1px] h-[7px]' : 'inset-y-[2px]',
            isFuture ? 'bg-[#d9b779]/75' : 'bg-[#f5f1e9]',
            week.efficiency === 'inefficient' && !isFuture && 'bg-[#e2b7a4]',
            week.efficiency === 'efficient' && !isFuture && 'bg-[#c5d6c4]',
            focused || inWindow ? 'opacity-100' : 'opacity-45',
          )}
          style={{ width: primaryW, left: 0 }}
          aria-hidden
        />
      </span>
    </button>
  );
}

function Metric({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-lg px-2.5 py-2',
        emphasize ? 'bg-[#d9b779]/12 ring-1 ring-[#d9b779]/25' : 'bg-white/5',
      )}
    >
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/40">
        {label}
      </p>
      <p
        className={cn(
          'mt-0.5 tabular-nums text-white',
          emphasize
            ? 'text-[1.05rem] font-semibold tracking-[-0.03em]'
            : 'text-[13px] font-medium',
        )}
      >
        {value}
      </p>
    </div>
  );
}

function TapeButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-white/8 px-2.5 py-1 text-[11px] font-medium text-white/75"
    >
      {children}
    </button>
  );
}

export type MeasuredTapePoint = {
  date: string;
  value: number;
  minimum?: number | null;
  maximum?: number | null;
};

export type MeasuredTapeSubject = {
  id: string;
  name: string;
  unit: string | null;
  aggregation: 'daily_total' | 'daily_average';
  points: MeasuredTapePoint[];
  currentWeek?: MeasuredTapeCurrentWeek | null;
};

export type MeasuredTapeCurrentWeek = {
  weekStart: string;
  value: number;
  minimum: number | null;
  maximum: number | null;
  dayCount: number;
  observedAt: string;
};

export type MeasuredTapeCost = {
  label: string;
  detail: string;
  points: MeasuredTapePoint[];
  currentWeek?: MeasuredTapeCurrentWeek | null;
};

type MeasuredWeek = {
  id: string;
  start: string;
  end: string;
  value: number;
  minimum: number | null;
  maximum: number | null;
  dayCount: number;
  isLive: boolean;
  observedAt: string | null;
};

function measurementDigits(unit: string | null) {
  if (!unit) return 1;
  if (/^(?:L|W|V|A|VA|MB|GB|%)$/i.test(unit)) return 0;
  if (/^(?:kWh|Mbit\/s|MB\/s|°C|hPa|lx|L\/min)$/i.test(unit)) return 1;
  return 2;
}

function isPoundSterling(unit: string | null) {
  return unit?.trim().toUpperCase() === 'GBP';
}

function formatMeasurement(value: number, unit: string | null) {
  if (isPoundSterling(unit)) {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
  const digits = measurementDigits(unit);
  const formatted = new Intl.NumberFormat('en-GB', {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

function calendarDate(value: string) {
  return new Date(`${value}T12:00:00.000Z`);
}

function weekStartFor(date: string) {
  const value = calendarDate(date);
  const weekday = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() - weekday + 1);
  return value.toISOString().slice(0, 10);
}

function addDays(date: string, days: number) {
  const value = calendarDate(date);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
  }).format(calendarDate(value));
}

function dateRange(start: string, end: string) {
  return start === end
    ? shortDate(start)
    : `${shortDate(start)} – ${shortDate(end)}`;
}

function buildMeasuredWeeks(subject: MeasuredTapeSubject) {
  const weekly = new Map<string, MeasuredWeek & { total: number }>();
  for (const point of [...subject.points].sort((left, right) =>
    left.date.localeCompare(right.date),
  )) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(point.date)) continue;
    const start = weekStartFor(point.date);
    const existing = weekly.get(start) ?? {
      id: `${subject.id}:${start}`,
      start,
      end: addDays(start, 6),
      value: 0,
      total: 0,
      minimum: null,
      maximum: null,
      dayCount: 0,
      isLive: false,
      observedAt: null,
    };
    existing.total += point.value;
    existing.dayCount += 1;
    existing.minimum =
      point.minimum == null
        ? existing.minimum
        : existing.minimum == null
          ? point.minimum
          : Math.min(existing.minimum, point.minimum);
    existing.maximum =
      point.maximum == null
        ? existing.maximum
        : existing.maximum == null
          ? point.maximum
          : Math.max(existing.maximum, point.maximum);
    weekly.set(start, existing);
  }

  const current = subject.currentWeek;
  if (
    current &&
    /^\d{4}-\d{2}-\d{2}$/.test(current.weekStart) &&
    Number.isFinite(current.value) &&
    current.dayCount >= 1 &&
    current.dayCount <= 7
  ) {
    weekly.set(current.weekStart, {
      id: `${subject.id}:${current.weekStart}:live`,
      start: current.weekStart,
      end: addDays(current.weekStart, 6),
      value: current.value,
      total: current.value,
      minimum: current.minimum,
      maximum: current.maximum,
      dayCount: current.dayCount,
      isLive: true,
      observedAt: current.observedAt,
    });
  }

  return [...weekly.values()]
    .map(({ total, ...week }) => ({
      ...week,
      value: week.isLive
        ? week.value
        : subject.aggregation === 'daily_total'
          ? total
          : total / Math.max(week.dayCount, 1),
    }))
    .sort((left, right) => left.start.localeCompare(right.start));
}

/**
 * The original Oriel tape, adapted for recorded sensor facts. It never
 * invents money from physical measurements, but renders native GBP sources as
 * their recorded costs.
 */
export function MeasuredWeeklyTape({
  subject,
  cost,
  className,
}: {
  subject: MeasuredTapeSubject;
  cost?: MeasuredTapeCost;
  className?: string;
}) {
  const weeks = buildMeasuredWeeks(subject);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const edgePadRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const latestIndex = Math.max(0, weeks.length - 1);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [edgePad, setEdgePad] = useState(100);
  const resolvedActiveIndex = Math.max(
    0,
    Math.min(activeIndex ?? latestIndex, latestIndex),
  );
  const active = weeks[resolvedActiveIndex] ?? weeks[latestIndex];
  const costWeeks = cost
    ? buildMeasuredWeeks({
        id: `${subject.id}:cost`,
        name: cost.label,
        unit: 'GBP',
        aggregation: 'daily_total',
        points: cost.points,
      })
    : [];
  const focusCost = active
    ? active.isLive
      ? cost?.currentWeek?.weekStart === active.start
        ? (buildMeasuredWeeks({
            id: `${subject.id}:cost:live`,
            name: cost.label,
            unit: 'GBP',
            aggregation: 'daily_total',
            points: [],
            currentWeek: cost.currentWeek,
          })[0] ?? null)
        : null
      : (costWeeks.find((week) => week.start === active.start) ?? null)
    : null;

  const recentPoints = [...subject.points]
    .filter((point) => /^\d{4}-\d{2}-\d{2}$/.test(point.date))
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 7);
  const recentTotal = recentPoints.reduce((sum, point) => sum + point.value, 0);
  const recentValue =
    subject.aggregation === 'daily_total'
      ? recentTotal
      : recentTotal / Math.max(recentPoints.length, 1);

  const maxValue = Math.max(...weeks.map((week) => Math.abs(week.value)), 1);

  const syncFromScroll = useCallback(() => {
    const node = scrollerRef.current;
    if (!node || !weeks.length) return;
    const next = indexFromScroll(
      node.scrollTop,
      node.clientHeight,
      edgePadRef.current,
      weeks.length,
    );
    setActiveIndex((previous) => (previous === next ? previous : next));
  }, [weeks.length]);

  const onScroll = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(syncFromScroll);
  }, [syncFromScroll]);

  const jumpToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      const node = scrollerRef.current;
      if (!node || !weeks.length) return;
      const clamped = Math.max(0, Math.min(weeks.length - 1, index));
      node.scrollTo({
        top: scrollTopForIndex(clamped, node.clientHeight, edgePadRef.current),
        behavior,
      });
      setActiveIndex(clamped);
    },
    [weeks.length],
  );

  useEffect(() => {
    const node = scrollerRef.current;
    if (!node || !weeks.length) return;
    const measure = () => {
      const pad = Math.max(
        24,
        Math.round(node.clientHeight / 2 - WEEK_HEIGHT / 2),
      );
      edgePadRef.current = pad;
      setEdgePad(pad);
      node.scrollTop = scrollTopForIndex(
        Math.max(0, weeks.length - 1),
        node.clientHeight,
        pad,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => {
      observer.disconnect();
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [weeks.length]);

  if (!weeks.length || !active) {
    return (
      <section
        className={cn(
          'rounded-2xl bg-[#102030] px-4 py-5 text-[#f5f1e9]',
          className,
        )}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d9b779]">
          Recorded history
        </p>
        <p className="mt-2 text-sm text-white/70">
          {formatMeasurement(0, subject.unit)} · no complete daily observation
          is available for this source.
        </p>
      </section>
    );
  }

  const modeLabel = isPoundSterling(subject.unit)
    ? 'Recorded cost'
    : subject.aggregation === 'daily_total'
      ? 'Recorded use'
      : 'Daily average';
  const range =
    active.minimum != null && active.maximum != null
      ? `${formatMeasurement(active.minimum, subject.unit)} – ${formatMeasurement(active.maximum, subject.unit)}`
      : null;

  return (
    <section
      aria-label={`${subject.name} weekly history`}
      className={cn(
        'overflow-hidden rounded-2xl bg-[#102030] text-[#f5f1e9]',
        className,
      )}
    >
      <div className="border-b border-white/10 px-4 pb-3 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d9b779]">
          {modeLabel} · {recentPoints.length} latest recorded days
          {recentPoints.length ? (
            <>
              <span className="mx-1.5 text-white/25">·</span>
              {dateRange(
                recentPoints.at(-1)?.date ?? active.start,
                recentPoints[0]?.date ?? active.end,
              )}
            </>
          ) : null}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Metric
            label={
              isPoundSterling(subject.unit)
                ? 'Cost · last 7 days'
                : subject.aggregation === 'daily_total'
                  ? 'Last 7 days'
                  : '7-day average'
            }
            value={formatMeasurement(recentValue, subject.unit)}
            emphasize
          />
          <Metric
            label="Complete days"
            value={String(subject.points.length)}
            emphasize
          />
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
              Focus week
              <span className="mx-1.5 text-white/25">·</span>
              {active.isLive ? 'Current week · ' : ''}
              {active.dayCount} {active.isLive ? 'elapsed' : 'recorded'} day
              {active.dayCount === 1 ? '' : 's'}
            </p>
            <p className="mt-1 text-[1.65rem] font-semibold leading-none tracking-[-0.05em] tabular-nums">
              {formatMeasurement(active.value, subject.unit)}
            </p>
            <p className="mt-1.5 text-[12px] leading-snug text-white/70">
              {dateRange(active.start, active.end)}
              {active.isLive && active.observedAt ? (
                <span className="ml-1 text-[10px] text-[#d9b779]">
                  · live to {shortDate(active.observedAt.slice(0, 10))}
                </span>
              ) : null}
            </p>
          </div>
          {focusCost || range ? (
            <div className="max-w-[9rem] text-right">
              {focusCost ? (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#d9b779]">
                    {cost?.label}
                  </p>
                  <p className="mt-1 text-[1.45rem] font-semibold leading-none tracking-[-0.04em] tabular-nums text-white">
                    {formatMeasurement(focusCost.value, 'GBP')}
                  </p>
                  <p className="mt-1 text-[10px] leading-4 text-white/50">
                    {cost?.detail} · {focusCost.dayCount} matching day
                    {focusCost.dayCount === 1 ? '' : 's'}
                  </p>
                </div>
              ) : null}
              {range ? (
                <div className={focusCost ? 'mt-3' : undefined}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                    Daily range
                  </p>
                  <p className="mt-1 text-[11px] leading-4 tabular-nums text-white/70">
                    {range}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="px-3 pb-1">
        <p className="mb-1 px-1 text-[9px] font-medium uppercase tracking-[0.12em] text-white/35">
          Weeks · current week is live · scroll to focus a period
        </p>
        <div className="relative">
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-px -translate-y-1/2 bg-[#d9b779]"
            aria-hidden
          />
          <div
            ref={scrollerRef}
            onScroll={onScroll}
            className={cn(
              'overflow-y-auto overscroll-y-contain touch-pan-y snap-y snap-mandatory',
              '[-webkit-overflow-scrolling:touch] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            )}
            style={{
              height: VIEWPORT_HEIGHT,
              WebkitOverflowScrolling: 'touch',
            }}
            aria-label={`${subject.name} recorded weekly ribbon`}
          >
            <div
              style={{
                height: edgePad * 2 + weeks.length * WEEK_HEIGHT,
                paddingTop: edgePad,
                paddingBottom: edgePad,
              }}
            >
              {weeks.map((week, index) => (
                <MeasuredWeekRow
                  key={week.id}
                  week={week}
                  unit={subject.unit}
                  max={maxValue}
                  focused={index === resolvedActiveIndex}
                  onActivate={() => jumpToIndex(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1.5 border-t border-white/10 px-3 py-2">
        <TapeButton onClick={() => jumpToIndex(0)}>Oldest</TapeButton>
        <TapeButton onClick={() => jumpToIndex(latestIndex)}>Latest</TapeButton>
      </div>
    </section>
  );
}

function MeasuredWeekRow({
  week,
  unit,
  max,
  focused,
  onActivate,
}: {
  week: MeasuredWeek;
  unit: string | null;
  max: number;
  focused: boolean;
  onActivate: () => void;
}) {
  return (
    <button
      type="button"
      id={week.id}
      aria-pressed={focused}
      aria-label={`${dateRange(week.start, week.end)}: ${formatMeasurement(week.value, unit)}`}
      onClick={onActivate}
      className={cn(
        'flex w-full snap-center items-center gap-2 px-1 focus-visible:outline-none',
        focused ? 'bg-white/[0.07]' : 'bg-white/[0.02]',
      )}
      style={{ height: WEEK_HEIGHT }}
    >
      <span className="w-[4.75rem] shrink-0 text-left leading-tight">
        <span
          className={cn(
            'block text-[10px] tabular-nums',
            focused ? 'font-semibold text-[#d9b779]' : 'text-white/55',
          )}
        >
          {dateRange(week.start, week.end)}
        </span>
        <span className="block text-[8px] tabular-nums text-white/30">
          {week.isLive ? 'Live · ' : ''}
          {week.dayCount} day{week.dayCount === 1 ? '' : 's'}
        </span>
      </span>
      <span
        className="relative h-[14px] flex-1"
        style={{ maxWidth: BAR_TRACK + 24 }}
      >
        <span
          className="absolute inset-y-0 left-0 rounded-sm bg-white/5"
          style={{ width: BAR_TRACK }}
          aria-hidden
        />
        <span
          className={cn(
            'absolute inset-y-[2px] left-0 rounded-sm bg-[#c5d6c4]',
            focused ? 'opacity-100' : 'opacity-55',
          )}
          style={{ width: barWidth(Math.abs(week.value), max) }}
          aria-hidden
        />
      </span>
      <span
        className={cn(
          'w-[4.7rem] shrink-0 text-right text-[10px] tabular-nums',
          focused ? 'font-semibold text-white' : 'text-white/55',
        )}
      >
        {formatMeasurement(week.value, unit)}
      </span>
    </button>
  );
}
