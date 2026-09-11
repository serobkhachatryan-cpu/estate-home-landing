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
      amount: 1970,
      prior: 1840,
      forecast: 2050,
      driver: 'Large-home pace (~£23.7k / year). Daytime peaks mostly on schedule.',
      unitNote: '~1,650 kWh this week',
    },
    {
      id: 'heating',
      label: 'Heating fuel',
      amount: 980,
      prior: 1120,
      forecast: 1280,
      driver: 'Milder nights and overnight hold still saving fuel.',
      unitNote: 'Oil tank at 64%',
    },
    {
      id: 'standby',
      label: 'Standby power',
      amount: 55,
      prior: 68,
      forecast: 60,
      driver: 'Plant-room baseload quieter after last week’s tidy-up · still the exception.',
      unitNote: '0.42 kW average overnight',
    },
    {
      id: 'water',
      label: 'Water / avoidable loss',
      amount: 220,
      prior: 205,
      forecast: 230,
      driver: 'On a ~£2.6k / year pace. One brief overnight rise flagged.',
      unitNote: 'Baseline flow mostly normal',
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      amount: 350,
      prior: 310,
      forecast: 420,
      driver: 'Includes plant-room filter visit; boiler service pending.',
      unitNote: 'Planned work dominant',
    },
  ],
  '30d': [
    {
      id: 'electricity',
      label: 'Electricity',
      amount: 1970,
      prior: 1840,
      forecast: 1970,
      driver: 'Tracks the ~£23.7k annual energy line.',
      unitNote: '~6,900 kWh',
    },
    {
      id: 'heating',
      label: 'Heating fuel',
      amount: 980,
      prior: 1120,
      forecast: 980,
      driver: 'Fuel burn tracking milder weather and occupancy.',
      unitNote: 'Tank draw ~14%',
    },
    {
      id: 'standby',
      label: 'Standby power',
      amount: 55,
      prior: 68,
      forecast: 55,
      driver: 'Baseload still a little high overnight — the open trim.',
      unitNote: '0.42 kW avg overnight',
    },
    {
      id: 'water',
      label: 'Water / avoidable loss',
      amount: 220,
      prior: 205,
      forecast: 220,
      driver: 'On a ~£2.6k / year pace.',
      unitNote: 'One brief overnight rise caught',
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      amount: 350,
      prior: 310,
      forecast: 350,
      driver: 'Planned filter visit; boiler service pending.',
      unitNote: 'Mostly scheduled visits',
    },
  ],
  '90d': [
    {
      id: 'electricity',
      label: 'Electricity',
      amount: 5920,
      prior: 5680,
      forecast: 5920,
      driver: 'Quarter tracks ~£23.7k / year energy.',
      unitNote: '~20.7 MWh',
    },
    {
      id: 'heating',
      label: 'Heating fuel',
      amount: 2680,
      prior: 2910,
      forecast: 2680,
      driver: 'Shoulder-season heating as expected.',
      unitNote: 'Fuel spend seasonal',
    },
    {
      id: 'standby',
      label: 'Standby power',
      amount: 165,
      prior: 190,
      forecast: 165,
      driver: 'Idle loads trimmed across plant room and AV.',
      unitNote: 'Consistent overnight baseload',
    },
    {
      id: 'water',
      label: 'Water / avoidable loss',
      amount: 660,
      prior: 690,
      forecast: 660,
      driver: 'Earlier leak catch avoided a larger repair bill.',
      unitNote: 'Loss events down',
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      amount: 1050,
      prior: 1240,
      forecast: 1050,
      driver: 'More planned visits, fewer emergency call-outs.',
      unitNote: 'Planned:reactive improved',
    },
  ],
  '12m': [
    {
      id: 'electricity',
      label: 'Electricity',
      amount: 23680,
      prior: 22100,
      forecast: 22400,
      driver: 'Large London house pace — matches Energy in the spend tree.',
      unitNote: '~83 MWh / year',
    },
    {
      id: 'heating',
      label: 'Heating fuel',
      amount: 9800,
      prior: 10200,
      forecast: 10100,
      driver: 'Oil / plant for colder months — separate from electricity line.',
      unitNote: 'Includes oil and related plant',
    },
    {
      id: 'standby',
      label: 'Standby power',
      amount: 720,
      prior: 840,
      forecast: 680,
      driver: 'Idle overnight still the open trim inside Energy.',
      unitNote: '~£60 / month avoidable if schedules hold',
    },
    {
      id: 'water',
      label: 'Water / avoidable loss',
      amount: 2640,
      prior: 2480,
      forecast: 2500,
      driver: 'Supply + wastewater · matches Water in the spend tree.',
      unitNote: '~£220 / month',
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      amount: 4200,
      prior: 4800,
      forecast: 4300,
      driver: 'Planned plant care supporting utilities.',
      unitNote: 'Filter / service visits',
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
