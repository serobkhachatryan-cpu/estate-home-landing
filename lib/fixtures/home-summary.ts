export type CategoryStatus = 'ok' | 'exception';

export type HomeCategory = {
  id: 'electricity' | 'water' | 'wear' | 'care' | 'investment';
  name: string;
  status: CategoryStatus;
  statusLabel: string;
  spent: string;
  benefit: string;
  benefitKind: string;
  /** One line Timur can read without opening detail */
  plainSummary: string;
  href: string;
  priority: 'now' | 'later';
};

export type HomeException = {
  id: string;
  category: string;
  title: string;
  whyItMatters: string;
  href: string;
};

export type PeriodTotals = {
  periodLabel: string;
  spent: string;
  benefitReturned: string;
  ratio: string;
  ratioPlain: string;
};

export const periodTotals: PeriodTotals = {
  periodLabel: 'This month',
  spent: '£1,420',
  benefitReturned: '£1,890 protected / put to use',
  ratio: '£1.33',
  ratioPlain:
    'For every £1 spent, about £1.33 came back as useful outcome or avoided waste',
};

/**
 * Simple home summary for Timur.
 * Electricity + water first. Wear / care / investment shown lightly;
 * cameras and people-tracking stay out of this stage.
 */
export const homeCategories: HomeCategory[] = [
  {
    id: 'electricity',
    name: 'Electricity',
    status: 'exception',
    statusLabel: 'Needs a look',
    spent: '£980',
    benefit:
      'Light, plant and appliances on schedule · less idle overnight waste',
    benefitKind: 'Useful power',
    plainSummary:
      'Most spend is doing useful work. Overnight standby is a little high.',
    href: '/app/electricity',
    priority: 'now',
  },
  {
    id: 'water',
    name: 'Water',
    status: 'exception',
    statusLabel: 'Needs a look',
    spent: '£90',
    benefit: 'Normal household use · one brief overnight rise caught early',
    benefitKind: 'Use + loss avoided',
    plainSummary:
      'Use looks normal. One overnight rise is the exception to review.',
    href: '/app/water',
    priority: 'now',
  },
  {
    id: 'wear',
    name: 'Natural wear',
    status: 'ok',
    statusLabel: 'Normal',
    spent: '—',
    benefit: 'Ageing of fabric and plant tracked as context, not a bill yet',
    benefitKind: 'Condition',
    plainSummary:
      'No accelerated wear flagged from electricity or water patterns.',
    href: '/app/care',
    priority: 'now',
  },
  {
    id: 'care',
    name: 'Supporting work',
    status: 'ok',
    statusLabel: 'Normal',
    spent: '£350',
    benefit: 'Filter service done · keeps systems earning their keep',
    benefitKind: 'Upkeep value',
    plainSummary:
      'Planned care this month supported reliable electricity and water systems.',
    href: '/app/care',
    priority: 'now',
  },
  {
    id: 'investment',
    name: 'Investment results',
    status: 'ok',
    statusLabel: 'Normal',
    spent: '£0 this month',
    benefit:
      'No new capital works this period · prior schedule work still paying back',
    benefitKind: 'Return on upgrades',
    plainSummary:
      'Nothing new invested this month. Earlier efficiency work still shows in quieter peaks.',
    href: '/app/care',
    priority: 'now',
  },
];

export const homeExceptions: HomeException[] = [
  {
    id: 'water-overnight',
    category: 'Water',
    title: 'Brief overnight flow rise',
    whyItMatters:
      'May be nothing — or the start of a slow leak. Worth confirming so spend stays useful, not waste.',
    href: '/app/water',
  },
  {
    id: 'electricity-standby',
    category: 'Electricity',
    title: 'Overnight standby a little high',
    whyItMatters:
      'Money is going to circuits that may not need to stay awake. Small, but repeated every night.',
    href: '/app/electricity',
  },
];

export const overallHomeStatus = {
  label: 'Everything looks normal',
  detail: 'Two small exceptions need a look. Nothing urgent.',
  exceptionCount: 2,
} as const;
