export type ValueRatioItem = {
  id: string;
  category: string;
  spent: string;
  spentNote: string;
  benefit: string;
  benefitKind: string;
  ratioLabel: string;
  ratioDetail: string;
  explanation: string;
  stage: 'now' | 'later';
};

export type ValueRatioSummary = {
  totalSpent: string;
  totalBenefit: string;
  headlineRatio: string;
  period: string;
};

/** What Timur paid this period vs what that money returned. */
export const valueRatioSummary: ValueRatioSummary = {
  totalSpent: '£2,540',
  totalBenefit: '£3,120 put to use / protected',
  headlineRatio: '£1.23',
  period: 'This month',
};

/** Stage 1 focus: electricity + water. Care rows support the same story. */
export const valueRatioBoard: ValueRatioItem[] = [
  {
    id: 'electricity',
    category: 'Electricity',
    spent: '£1,970',
    spentNote: 'Whole-home power this month · ~£23.7k / year pace',
    benefit:
      'Useful work: lighting, plant, appliances on how the house is used',
    benefitKind: 'Useful power',
    ratioLabel: '£1 → £1.08 useful',
    ratioDetail: '≈£50–60 / month of avoidable idle load still open to trim',
    explanation:
      'kWh only matter as: what ran, was it needed, and did the money buy useful outcome or waste.',
    stage: 'now',
  },
  {
    id: 'water',
    category: 'Water',
    spent: '£220',
    spentNote: 'Supply + wastewater this month · ~£2.6k / year pace',
    benefit: 'Normal household use · early catch on overnight rise',
    benefitKind: 'Use + loss avoided',
    ratioLabel: '£1 → £5+ protected',
    ratioDetail:
      'Illustrative repair path avoided if the rise had become a leak',
    explanation:
      'Litres only matter as: intentional use vs loss. Benefit is water that did a job — or damage not paid for.',
    stage: 'now',
  },
  {
    id: 'care',
    category: 'Supporting work',
    spent: '£350',
    spentNote: 'Filter / planned upkeep',
    benefit: 'Keeps electricity and water systems earning their spend',
    benefitKind: 'Upkeep value',
    ratioLabel: '£1 → reliability',
    ratioDetail:
      'Supports the two priority utilities — not a separate gadget story',
    explanation:
      'Care spend is valuable when it protects the usefulness of electricity and water — not as a checklist of visits.',
    stage: 'now',
  },
];
