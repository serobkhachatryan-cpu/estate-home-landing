export type ProductStage = {
  id: string;
  when: 'now' | 'next' | 'later';
  title: string;
  summary: string;
  items: string[];
  openQuestions?: string[];
};

/**
 * Homework from the Timur discussion: break the big vision into stages.
 * Final UI still waits on Timur's own dashboard sketch.
 */
export const productStages: ProductStage[] = [
  {
    id: 'stage-1',
    when: 'now',
    title: 'Stage 1 — Spend tree for Timur’s home',
    summary:
      'Plan · Fact · Forecast at the top. Parameters across the house. Utilities opened into subparameters. Cash flow beside the ledger.',
    items: [
      'Pilot property = Timur’s home',
      'Headline: Plan £430k · Fact £475k · Forecast £455k (illustrative)',
      'Parameters: occupancy, staff, utilities, transportation, renovation, inventory (policies inside), insurance, livestock (garden inside)',
      'Utilities → energy uses a Revolut-style weekly tape: 52w plan/fact back, 52w forecast/cashflow forward',
      'Utilities subs: energy, fuel, water, security, safety, back-ups, telecomm, AC, fountain',
      'Cash flow total with period draws (1 / 2 / 3)',
      'Paid → received kept as a supporting lens on energy and water',
      'No surveillance wall — security may appear as a cost line only',
    ],
    openQuestions: [
      'Confirm which parameters need real sub-trees next',
      'How Plan is set and who owns Forecast revisions',
      'How cash-flow periods map to Timur’s calendar',
    ],
  },
  {
    id: 'stage-2',
    when: 'next',
    title: 'Stage 2 — Drivers, wear, investment results',
    summary:
      'Once the spend tree feels right, deepen why Fact moved and what capital returned.',
    items: [
      'Plain-English drivers behind over/under plan',
      'Methodology for natural wear',
      'Value of supporting / planned work',
      'Results of investments / upgrades over time',
    ],
    openQuestions: [
      'Agree metrics with Timur before building more UI',
      'Budget and timeline for Stage 2',
    ],
  },
  {
    id: 'stage-3',
    when: 'later',
    title: 'Stage 3 — Later ideas (explicitly deferred)',
    summary:
      'Keep these out of the first product until the spend tree is trusted.',
    items: [
      'Video surveillance',
      'Tracking people’s movement in the house',
      'Full multi-system “estate console”',
      'Marketing landing as the main push',
    ],
  },
];

export const discussionStatus = {
  prototypeNote:
    'This iteration follows Timur’s handwritten Plan / Fact / Forecast spend tree — still a working sketch, not a final UI.',
  waitingOn:
    'Confirm parameter list and which subtrees need live numbers next.',
  yourHomework:
    'Stage the vision: now / next / later — updated after the spend sketch.',
  sashaNote:
    'Task capture/help for Timur discussed; detailed assignment plan not yet written.',
} as const;
