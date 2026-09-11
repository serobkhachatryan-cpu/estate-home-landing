/**
 * Spend ledger for a substantial London private home (pilot).
 * Headline Plan / Fact / Forecast kept from Timur’s sketch.
 * Line items sized to believable UK estate operating costs.
 *
 * - policies → inventory
 * - garden → livestock
 */

export type SpendVariance = 'under' | 'on' | 'over';

export type SpendSubparameter = {
  id: string;
  name: string;
  note?: string;
  plan: number;
  fact: number;
  forecast: number;
  href?: string;
};

export type SpendParameter = {
  id: string;
  name: string;
  plan: number;
  fact: number;
  forecast: number;
  blurb: string;
  subparameters?: SpendSubparameter[];
};

export type CashFlowPeriod = {
  id: string;
  label: string;
  amount: number;
  note?: string;
};

export type SpendHeadline = {
  periodLabel: string;
  plan: number;
  fact: number;
  forecast: number;
};

export const spendParameterAliases: Record<string, string> = {
  garden: 'livestock',
  policies: 'inventory',
};

/** From Timur’s sketch — annual operating envelope. */
export const spendHeadline: SpendHeadline = {
  periodLabel: 'This year',
  plan: 429_800,
  fact: 475_023.24,
  forecast: 455_200,
};

/**
 * Realistic split for a large London home in an active year
 * (staff-heavy, renovation under way, utilities with AC / security / pumps).
 * Parameter facts sum to headline Fact.
 */
export const spendParameters: SpendParameter[] = [
  {
    id: 'occupancy',
    name: 'Occupancy',
    plan: 26_000,
    fact: 28_400,
    forecast: 27_200,
    blurb: 'Cost of how the house is used — full, guest, or empty.',
    subparameters: [
      {
        id: 'owner-stays',
        name: 'Owner stays',
        plan: 12_000,
        fact: 12_800,
        forecast: 12_400,
      },
      {
        id: 'guest-periods',
        name: 'Guest periods',
        plan: 8_500,
        fact: 9_600,
        forecast: 9_000,
      },
      {
        id: 'empty-house',
        name: 'Empty-house running',
        plan: 5_500,
        fact: 6_000,
        forecast: 5_800,
      },
    ],
  },
  {
    id: 'staff',
    name: 'Staff',
    plan: 118_000,
    fact: 124_800,
    forecast: 121_500,
    blurb: 'People who keep the house running — usually the largest opex line.',
    subparameters: [
      {
        id: 'housekeeping',
        name: 'Housekeeping',
        plan: 48_000,
        fact: 50_400,
        forecast: 49_200,
      },
      {
        id: 'grounds',
        name: 'Grounds team',
        plan: 36_000,
        fact: 37_800,
        forecast: 37_000,
      },
      {
        id: 'specialists',
        name: 'Specialist visits',
        plan: 34_000,
        fact: 36_600,
        forecast: 35_300,
      },
    ],
  },
  {
    id: 'utilities',
    name: 'Utilities',
    plan: 61_800,
    fact: 67_060,
    forecast: 64_300,
    blurb: 'Energy, fuel, water and the systems that keep the house liveable.',
    subparameters: [
      {
        id: 'energy',
        name: 'Energy',
        note: 'Electricity for a large London house — light, plant, kitchen, AV.',
        // ~£420–520 / week in winter peaks; ~£18–22k / year is typical for this scale.
        plan: 21_500,
        fact: 23_680,
        forecast: 22_400,
        href: '/app/electricity',
      },
      {
        id: 'fuel',
        name: 'Fuel',
        note: 'Heating oil / gas for the house — outdoor temp drives winter spend.',
        plan: 9_800,
        fact: 10_640,
        forecast: 10_200,
      },
      {
        id: 'water',
        name: 'Water',
        note: 'Supply + wastewater for house and garden use.',
        plan: 2_400,
        fact: 2_640,
        forecast: 2_500,
        href: '/app/water',
      },
      {
        id: 'security',
        name: 'Security',
        note: 'Fence, CCTV, monitoring contracts.',
        plan: 9_600,
        fact: 10_150,
        forecast: 9_900,
      },
      {
        id: 'safety',
        name: 'Safety',
        plan: 2_800,
        fact: 2_950,
        forecast: 2_880,
      },
      {
        id: 'back-ups',
        name: 'Back-ups',
        note: 'Generator service, UPS, fuel for failover.',
        plan: 4_200,
        fact: 4_480,
        forecast: 4_300,
      },
      {
        id: 'telecomm',
        name: 'Telecomm',
        plan: 3_600,
        fact: 3_780,
        forecast: 3_700,
      },
      {
        id: 'air-conditioning',
        name: 'Air conditioning',
        plan: 5_400,
        fact: 6_120,
        forecast: 5_700,
      },
      {
        id: 'fountain',
        name: 'Fountain',
        plan: 2_500,
        fact: 2_620,
        forecast: 2_720,
      },
    ],
  },
  {
    id: 'transportation',
    name: 'Transportation',
    plan: 29_000,
    fact: 31_200,
    forecast: 30_100,
    blurb: 'Cars, fuel, transfers tied to the house.',
    subparameters: [
      {
        id: 'vehicles',
        name: 'Vehicles',
        plan: 16_500,
        fact: 17_400,
        forecast: 17_000,
      },
      {
        id: 'fuel-transfers',
        name: 'Fuel & transfers',
        plan: 12_500,
        fact: 13_800,
        forecast: 13_100,
      },
    ],
  },
  {
    id: 'renovation',
    name: 'Renovation',
    plan: 92_000,
    fact: 108_600,
    forecast: 99_500,
    blurb: 'Fabric works — the line that moves most in an active year.',
    subparameters: [
      {
        id: 'planned-works',
        name: 'Planned works',
        plan: 64_000,
        fact: 71_200,
        forecast: 68_000,
      },
      {
        id: 'snagging',
        name: 'Snagging & finish',
        plan: 28_000,
        fact: 37_400,
        forecast: 31_500,
      },
    ],
  },
  {
    id: 'inventory',
    name: 'Inventory',
    plan: 31_000,
    fact: 32_763.24,
    forecast: 31_800,
    blurb: 'Stores, replacements — and policies inside inventory.',
    subparameters: [
      {
        id: 'consumables',
        name: 'Consumables',
        plan: 9_500,
        fact: 10_400,
        forecast: 9_900,
      },
      {
        id: 'replacements',
        name: 'Replacements',
        plan: 6_500,
        fact: 7_200,
        forecast: 6_800,
      },
      {
        id: 'memberships',
        name: 'Memberships',
        note: 'Policies · standing memberships',
        plan: 6_000,
        fact: 5_740,
        forecast: 5_900,
      },
      {
        id: 'compliance',
        name: 'Compliance & filings',
        note: 'Policies · compliance inside inventory',
        plan: 9_000,
        fact: 9_423.24,
        forecast: 9_200,
      },
    ],
  },
  {
    id: 'insurance',
    name: 'Insurance',
    plan: 33_000,
    fact: 34_650,
    forecast: 33_800,
    blurb: 'Buildings, contents and liability for a high-value London home.',
    subparameters: [
      {
        id: 'buildings',
        name: 'Buildings',
        plan: 21_000,
        fact: 22_050,
        forecast: 21_500,
      },
      {
        id: 'contents-liability',
        name: 'Contents & liability',
        plan: 12_000,
        fact: 12_600,
        forecast: 12_300,
      },
    ],
  },
  {
    id: 'livestock',
    name: 'Livestock',
    plan: 39_000,
    fact: 47_550,
    forecast: 47_000,
    blurb: 'Animals and grounds — garden sits inside livestock here.',
    subparameters: [
      {
        id: 'feed-care',
        name: 'Feed & care',
        plan: 9_500,
        fact: 10_400,
        forecast: 10_000,
      },
      {
        id: 'vet-housing',
        name: 'Vet & housing',
        plan: 5_500,
        fact: 6_150,
        forecast: 5_800,
      },
      {
        id: 'planting',
        name: 'Planting & beds',
        note: 'Garden · under livestock',
        plan: 9_000,
        fact: 11_800,
        forecast: 12_200,
      },
      {
        id: 'irrigation',
        name: 'Irrigation',
        note: 'Garden · under livestock',
        plan: 7_000,
        fact: 9_200,
        forecast: 9_500,
      },
      {
        id: 'hardscape',
        name: 'Hardscape upkeep',
        note: 'Garden · under livestock',
        plan: 8_000,
        fact: 10_000,
        forecast: 9_500,
      },
    ],
  },
];

/** Quarterly cash draws — typical pattern: large Q1 premium/works, then smaller top-ups. */
export const cashFlow = {
  label: 'Cash flow',
  total: 116_000,
  periods: [
    {
      id: 'p1',
      label: 'Q1',
      amount: 68_000,
      note: 'Insurance + renovation start',
    },
    {
      id: 'p2',
      label: 'Q2',
      amount: 24_000,
      note: 'Staff + utilities',
    },
    {
      id: 'p3',
      label: 'Q3',
      amount: 24_000,
      note: 'Summer grounds + finish works',
    },
  ] satisfies CashFlowPeriod[],
};

export function resolveSpendParameterId(id: string): string {
  return spendParameterAliases[id] ?? id;
}

export function getSpendParameter(id: string): SpendParameter | undefined {
  return spendParameters.find(
    (item) => item.id === resolveSpendParameterId(id),
  );
}

export function getSpendSubparameter(
  parameterId: string,
  subId: string,
): { parameter: SpendParameter; subparameter: SpendSubparameter } | undefined {
  const parameter = getSpendParameter(parameterId);
  const subparameter = parameter?.subparameters?.find((item) => item.id === subId);
  if (!parameter || !subparameter) return undefined;
  return { parameter, subparameter };
}

export function varianceAgainstPlan(
  fact: number,
  plan: number,
): SpendVariance {
  const delta = fact - plan;
  const tolerance = Math.max(plan * 0.02, 400);
  if (delta > tolerance) return 'over';
  if (delta < -tolerance) return 'under';
  return 'on';
}

export function formatSpend(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatSpendDelta(fact: number, plan: number): string {
  const delta = fact - plan;
  const abs = formatSpend(Math.abs(delta));
  if (delta > 0) return `${abs} over plan`;
  if (delta < 0) return `${abs} under plan`;
  return 'On plan';
}
