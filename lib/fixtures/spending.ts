import type { SpendCategory, TimeRange } from './types';

export type SpendBreakdownItem = {
  id: SpendCategory;
  label: string;
  amount: number;
  prior: number;
  forecast: number;
  driver: string;
  unitNote: string;
};

export type SpendOpportunity = {
  id: string;
  title: string;
  annualEffect: string;
  confidence: 'High' | 'Medium' | 'Indicative';
  explanation: string;
};

export type SpendSeriesPoint = {
  label: string;
  electricity: number;
  heating: number;
  standby: number;
  water: number;
  maintenance: number;
};

export const spendTimeRanges: { id: TimeRange; label: string }[] = [
  { id: 'mtd', label: 'Month to date' },
  { id: '30d', label: 'Last 30 days' },
  { id: '90d', label: 'Last 90 days' },
  { id: '12m', label: 'Last 12 months' },
];

export const spendCategories: { id: SpendCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All categories' },
  { id: 'electricity', label: 'Electricity' },
  { id: 'heating', label: 'Heating fuel' },
  { id: 'standby', label: 'Standby power' },
  { id: 'water', label: 'Water / avoidable loss' },
  { id: 'maintenance', label: 'Maintenance' },
];

const breakdownByRange: Record<TimeRange, SpendBreakdownItem[]> = {
  mtd: [
    {
      id: 'electricity',
      label: 'Electricity',
      amount: 980,
      prior: 1060,
      forecast: 1320,
      driver: 'Occupancy schedules holding daytime peaks down.',
      unitNote: '412 kWh this week',
    },
    {
      id: 'heating',
      label: 'Heating fuel',
      amount: 1120,
      prior: 1240,
      forecast: 1680,
      driver: 'Milder nights and overnight hold still saving fuel.',
      unitNote: 'Oil tank at 64%',
    },
    {
      id: 'standby',
      label: 'Standby power',
      amount: 210,
      prior: 245,
      forecast: 290,
      driver: 'Plant-room baseload quieter after last week’s tidy-up.',
      unitNote: '0.42 kW average overnight',
    },
    {
      id: 'water',
      label: 'Water / avoidable loss',
      amount: 90,
      prior: 140,
      forecast: 120,
      driver: 'No sustained overnight loss after garden-line watch.',
      unitNote: 'Baseline flow normal',
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      amount: 440,
      prior: 380,
      forecast: 620,
      driver: 'Includes plant-room filter visit; boiler service pending.',
      unitNote: 'Planned work dominant',
    },
  ],
  '30d': [
    {
      id: 'electricity',
      label: 'Electricity',
      amount: 1380,
      prior: 1510,
      forecast: 1380,
      driver: 'Weekday peaks remain below last month’s pattern.',
      unitNote: '1,760 kWh',
    },
    {
      id: 'heating',
      label: 'Heating fuel',
      amount: 1620,
      prior: 1890,
      forecast: 1620,
      driver: 'Fuel burn tracking milder weather and occupancy.',
      unitNote: 'Tank draw ~21%',
    },
    {
      id: 'standby',
      label: 'Standby power',
      amount: 295,
      prior: 340,
      forecast: 295,
      driver: 'Baseload within the quiet band Oriel expects.',
      unitNote: '0.44 kW avg overnight',
    },
    {
      id: 'water',
      label: 'Water / avoidable loss',
      amount: 130,
      prior: 210,
      forecast: 130,
      driver: 'Avoidable loss lower after garden-line intervention.',
      unitNote: 'One brief overnight rise caught',
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      amount: 620,
      prior: 910,
      forecast: 620,
      driver: 'Planned work replaced two reactive call-outs.',
      unitNote: 'Mostly scheduled visits',
    },
  ],
  '90d': [
    {
      id: 'electricity',
      label: 'Electricity',
      amount: 4120,
      prior: 4680,
      forecast: 4120,
      driver: 'Seasonal cooling demand lower than prior period.',
      unitNote: '5.1 MWh',
    },
    {
      id: 'heating',
      label: 'Heating fuel',
      amount: 3280,
      prior: 2910,
      forecast: 3280,
      driver: 'Shoulder-season heating started earlier than last year.',
      unitNote: 'Fuel spend rising as expected',
    },
    {
      id: 'standby',
      label: 'Standby power',
      amount: 880,
      prior: 1010,
      forecast: 880,
      driver: 'Idle loads trimmed across plant room and AV.',
      unitNote: 'Consistent overnight baseload',
    },
    {
      id: 'water',
      label: 'Water / avoidable loss',
      amount: 410,
      prior: 690,
      forecast: 410,
      driver: 'Earlier leak catch avoided a larger repair bill.',
      unitNote: 'Loss events down',
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      amount: 1860,
      prior: 2540,
      forecast: 1860,
      driver: 'More planned visits, fewer emergency call-outs.',
      unitNote: 'Planned:reactive improved',
    },
  ],
  '12m': [
    {
      id: 'electricity',
      label: 'Electricity',
      amount: 13300,
      prior: 20000,
      forecast: 13300,
      driver: 'Schedules aligned to occupancy across the year.',
      unitNote: 'Illustrative annual figure',
    },
    {
      id: 'heating',
      label: 'Heating fuel',
      amount: 9800,
      prior: 16800,
      forecast: 9800,
      driver: 'Demand and runtime made visible through the winter.',
      unitNote: 'Includes oil and related plant',
    },
    {
      id: 'standby',
      label: 'Standby power',
      amount: 2400,
      prior: 6600,
      forecast: 2400,
      driver: 'Baseload reduced without affecting comfort.',
      unitNote: 'Idle loads reined in',
    },
    {
      id: 'water',
      label: 'Water / avoidable loss',
      amount: 2500,
      prior: 6600,
      forecast: 2500,
      driver: 'Slow leak identified early in the first year.',
      unitNote: 'Avoidable repairs included',
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      amount: 6000,
      prior: 15400,
      forecast: 6000,
      driver: 'Early warnings shifted spend to planned service.',
      unitNote: 'Illustrative annual figure',
    },
  ],
};

const seriesByRange: Record<TimeRange, SpendSeriesPoint[]> = {
  mtd: [
    {
      label: 'W1',
      electricity: 240,
      heating: 260,
      standby: 50,
      water: 20,
      maintenance: 0,
    },
    {
      label: 'W2',
      electricity: 255,
      heating: 280,
      standby: 52,
      water: 25,
      maintenance: 120,
    },
    {
      label: 'W3',
      electricity: 245,
      heating: 290,
      standby: 54,
      water: 22,
      maintenance: 0,
    },
    {
      label: 'W4',
      electricity: 240,
      heating: 290,
      standby: 54,
      water: 23,
      maintenance: 320,
    },
  ],
  '30d': [
    {
      label: 'W1',
      electricity: 340,
      heating: 390,
      standby: 72,
      water: 30,
      maintenance: 0,
    },
    {
      label: 'W2',
      electricity: 355,
      heating: 410,
      standby: 74,
      water: 35,
      maintenance: 180,
    },
    {
      label: 'W3',
      electricity: 340,
      heating: 420,
      standby: 75,
      water: 32,
      maintenance: 0,
    },
    {
      label: 'W4',
      electricity: 345,
      heating: 400,
      standby: 74,
      water: 33,
      maintenance: 440,
    },
  ],
  '90d': [
    {
      label: 'Jul',
      electricity: 1480,
      heating: 620,
      standby: 290,
      water: 150,
      maintenance: 420,
    },
    {
      label: 'Aug',
      electricity: 1390,
      heating: 580,
      standby: 285,
      water: 130,
      maintenance: 510,
    },
    {
      label: 'Sep',
      electricity: 1250,
      heating: 2080,
      standby: 305,
      water: 130,
      maintenance: 930,
    },
  ],
  '12m': [
    {
      label: 'Oct',
      electricity: 1180,
      heating: 980,
      standby: 210,
      water: 240,
      maintenance: 520,
    },
    {
      label: 'Dec',
      electricity: 1260,
      heating: 1420,
      standby: 220,
      water: 210,
      maintenance: 610,
    },
    {
      label: 'Feb',
      electricity: 1210,
      heating: 1380,
      standby: 215,
      water: 190,
      maintenance: 540,
    },
    {
      label: 'Apr',
      electricity: 1090,
      heating: 720,
      standby: 200,
      water: 220,
      maintenance: 480,
    },
    {
      label: 'Jun',
      electricity: 980,
      heating: 310,
      standby: 190,
      water: 250,
      maintenance: 390,
    },
    {
      label: 'Aug',
      electricity: 1020,
      heating: 280,
      standby: 185,
      water: 210,
      maintenance: 420,
    },
    {
      label: 'Sep',
      electricity: 980,
      heating: 1120,
      standby: 210,
      water: 90,
      maintenance: 440,
    },
  ],
};

export function getSpendBreakdown(range: TimeRange): SpendBreakdownItem[] {
  return breakdownByRange[range];
}

export function getSpendSeries(range: TimeRange): SpendSeriesPoint[] {
  return seriesByRange[range];
}

export const spendOpportunities: SpendOpportunity[] = [
  {
    id: 'overnight-heat',
    title: 'Lower overnight heating hold',
    annualEffect: '£450–£660 / year',
    confidence: 'Medium',
    explanation:
      'Based on current occupancy and recent weather. Not a guaranteed saving—depends on how cold the season runs.',
  },
  {
    id: 'standby-av',
    title: 'Trim idle AV and plant baseload',
    annualEffect: '£180–£260 / year',
    confidence: 'High',
    explanation:
      'Measured overnight baseload is still carrying a few always-on circuits that can sleep when the house is empty.',
  },
  {
    id: 'planned-boiler',
    title: 'Keep boiler service on plan',
    annualEffect: 'Avoids reactive call-outs',
    confidence: 'Indicative',
    explanation:
      'Planned service is usually cheaper than a mid-winter failure. Oriel cannot promise a specific pound figure.',
  },
];

export function formatPounds(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(value);
}
