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
    title: 'Stage 1 — Timur’s home, electricity & water',
    summary:
      'One real home. Prove spend → benefit for electricity and water. Simple home screen: categories, all-normal, exceptions only.',
    items: [
      'Pilot property = Timur’s home (not a marketing estate story)',
      'Core question: what did I pay, and what useful outcome did I get?',
      'Priority utilities: electricity and water only',
      'Home screen: category cards + status + exceptions; detail on drill-in',
      'Supporting work and wear shown only as context for those utilities',
      'No cameras, no people-tracking, no surveillance wall',
    ],
    openQuestions: [
      'Exact dashboard layout — Timur to sketch',
      'How we measure “natural wear” in plain language',
      'How we price the value of supporting work',
    ],
  },
  {
    id: 'stage-2',
    when: 'next',
    title: 'Stage 2 — Wear, care value, investment results',
    summary:
      'Once electricity/water ratios feel right, deepen house-condition and capital-return language.',
    items: [
      'Methodology for natural wear (fabric, plant, age)',
      'Value of supporting / planned work vs reactive spend',
      'Results of investments / upgrades over time',
      'Stronger period comparisons Timur can trust',
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
      'Timur called these non-urgent. Keep them out of the first product.',
    items: [
      'Video surveillance',
      'Tracking people’s movement in the house',
      'Full multi-system “estate console” (security, perimeter, network wall)',
      'Marketing landing / competitor research as the main push',
    ],
  },
];

export const discussionStatus = {
  prototypeNote:
    'First prototype was only a distant match. This build is a Stage 1 working sketch — not a final agreed UI.',
  waitingOn:
    'Timur to draw his preferred dashboard, then continue the discussion.',
  yourHomework:
    'Stage the vision: now / next / later — done in this Stages screen.',
  sashaNote:
    'Task capture/help for Timur discussed; detailed assignment plan not yet written.',
} as const;
