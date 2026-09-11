/**
 * Deterministic spend series for parameters / subparameters.
 * Fact history + prediction forward, with plan as a reference band.
 */

export type SpendDiagramRange = 'daily' | 'weekly' | 'monthly' | 'annually';

export type SpendSeriesPoint = {
  label: string;
  /** Observed spend in the bucket (undefined in pure future buckets) */
  actual?: number;
  /** Model prediction (shown through the forecast window) */
  predicted?: number;
  /** Plan pace for the same bucket */
  plan?: number;
  kind: 'history' | 'bridge' | 'forecast';
};

export const spendDiagramRanges: {
  id: SpendDiagramRange;
  label: string;
  hint: string;
}[] = [
  {
    id: 'daily',
    label: 'Daily',
    hint: 'Last 14 days + 7-day prediction',
  },
  {
    id: 'weekly',
    label: 'Weekly',
    hint: 'Last 8 weeks + 4-week prediction',
  },
  {
    id: 'monthly',
    label: 'Monthly',
    hint: 'Last 12 months + 3-month prediction',
  },
  {
    id: 'annually',
    label: 'Annually',
    hint: 'Last 5 years + next-year prediction',
  },
];

type SeriesInput = {
  id: string;
  plan: number;
  fact: number;
  forecast: number;
};

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function labelsFor(range: SpendDiagramRange): {
  history: string[];
  forecast: string[];
} {
  if (range === 'daily') {
    return {
      history: Array.from({ length: 14 }, (_, i) => `D-${13 - i}`),
      forecast: Array.from({ length: 7 }, (_, i) => `+${i + 1}d`),
    };
  }
  if (range === 'weekly') {
    return {
      history: Array.from({ length: 8 }, (_, i) => `W${i + 1}`),
      forecast: Array.from({ length: 4 }, (_, i) => `F${i + 1}`),
    };
  }
  if (range === 'monthly') {
    const months = [
      'Oct',
      'Nov',
      'Dec',
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
    ];
    return {
      history: months,
      forecast: ['Oct′', 'Nov′', 'Dec′'],
    };
  }
  return {
    history: ['2021', '2022', '2023', '2024', '2025'],
    forecast: ['2026'],
  };
}

function bucketTargets(input: SeriesInput, range: SpendDiagramRange) {
  const historyCount =
    range === 'daily' ? 14 : range === 'weekly' ? 8 : range === 'monthly' ? 12 : 5;
  const forecastCount =
    range === 'daily' ? 7 : range === 'weekly' ? 4 : range === 'monthly' ? 3 : 1;

  // Scale annual totals into per-bucket averages for the chosen grain.
  const yearFactor =
    range === 'daily'
      ? 365
      : range === 'weekly'
        ? 52
        : range === 'monthly'
          ? 12
          : 1;

  return {
    historyCount,
    forecastCount,
    planBucket: input.plan / yearFactor,
    factBucket: input.fact / yearFactor,
    forecastBucket: input.forecast / yearFactor,
  };
}

/**
 * Build a continuous series: history (actual + plan), bridge point, then
 * prediction window (predicted + plan). Seeded so each parameter looks distinct.
 */
export function buildSpendSeries(
  input: SeriesInput,
  range: SpendDiagramRange,
): SpendSeriesPoint[] {
  const rand = mulberry32(hashSeed(`${input.id}:${range}`));
  const { history, forecast } = labelsFor(range);
  const {
    historyCount,
    forecastCount,
    planBucket,
    factBucket,
    forecastBucket,
  } = bucketTargets(input, range);

  const pace = factBucket / Math.max(planBucket, 1);
  const points: SpendSeriesPoint[] = [];

  for (let i = 0; i < historyCount; i += 1) {
    const progress = i / Math.max(historyCount - 1, 1);
    // Ease from slightly under plan early in the year toward current fact pace.
    const drift = 0.86 + progress * (pace - 0.86);
    const noise = 0.92 + rand() * 0.16;
    const seasonal =
      range === 'monthly'
        ? 1 + 0.08 * Math.sin((i / 12) * Math.PI * 2)
        : range === 'daily'
          ? 1 + 0.05 * Math.sin(i / 2)
          : 1 + 0.04 * Math.sin(i / 3);

    const actual = roundMoney(planBucket * drift * noise * seasonal);
    const predicted = roundMoney(actual * (0.97 + rand() * 0.06));

    points.push({
      label: history[i] ?? `H${i + 1}`,
      actual,
      predicted: i === historyCount - 1 ? predicted : undefined,
      plan: roundMoney(planBucket * seasonal),
      kind: i === historyCount - 1 ? 'bridge' : 'history',
    });
  }

  const lastActual = points[points.length - 1]?.actual ?? factBucket;

  for (let i = 0; i < forecastCount; i += 1) {
    const progress = (i + 1) / (forecastCount + 1);
    // Prediction pulls from last actual toward the period forecast pace.
    const target = lastActual * (1 - progress) + forecastBucket * progress;
    const noise = 0.96 + rand() * 0.08;
    const predicted = roundMoney(target * noise);

    points.push({
      label: forecast[i] ?? `P${i + 1}`,
      predicted,
      plan: roundMoney(planBucket),
      kind: 'forecast',
    });
  }

  return points;
}

export function seriesSummary(points: SpendSeriesPoint[]) {
  const history = points.filter((p) => p.actual != null);
  const forecast = points.filter((p) => p.kind === 'forecast');
  const actualTotal = history.reduce((sum, p) => sum + (p.actual ?? 0), 0);
  const predictedTotal = forecast.reduce(
    (sum, p) => sum + (p.predicted ?? 0),
    0,
  );
  const planTotal = points.reduce((sum, p) => sum + (p.plan ?? 0), 0);

  return {
    actualTotal: roundMoney(actualTotal),
    predictedTotal: roundMoney(predictedTotal),
    planTotal: roundMoney(planTotal),
    historyBuckets: history.length,
    forecastBuckets: forecast.length,
  };
}
