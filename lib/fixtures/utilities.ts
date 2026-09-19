export type UtilityReading = {
  label: string;
  value: string;
  context: string;
};

export type UtilityDetail = {
  id: 'electricity' | 'water';
  name: string;
  statusLabel: string;
  status: 'ok' | 'exception';
  spent: string;
  benefit: string;
  plainStory: string;
  readings: UtilityReading[];
  exception?: {
    title: string;
    detail: string;
    nextStep: string;
  };
  whatWeAreNotDoing: string;
};

export const electricityDetail: UtilityDetail = {
  id: 'electricity',
  name: 'Electricity',
  statusLabel: 'Historical meter selected',
  status: 'ok',
  spent: 'Billing data not imported',
  benefit: 'Recorded consumption is shown separately from invoice data',
  plainStory:
    'Oriel keeps meter history and financial records separate. A kWh reading is a recorded measurement; a cost becomes fact only when a bill or approved tariff model is available.',
  readings: [
    {
      label: 'Meter history',
      value: 'Imported',
      context: 'Only validated source intervals are shown',
    },
    {
      label: 'Cost',
      value: 'Not billed',
      context: 'An estimate is never presented as an invoice',
    },
    {
      label: 'Scope',
      value: 'Selected meter',
      context: 'No unconfirmed estate-wide aggregation',
    },
  ],
  whatWeAreNotDoing:
    'No camera feeds, no people-tracking, no per-bulb toy controls. Stage 1 is recorded meter use with explicit financial evidence.',
};

export const waterDetail: UtilityDetail = {
  id: 'water',
  name: 'Water',
  statusLabel: 'Historical meter selected',
  status: 'ok',
  spent: 'Billing data not imported',
  benefit: 'Only continuous, validated meter intervals are shown',
  plainStory:
    'Water history is shown only after Oriel’s continuity checks. Older intervals that cannot be trusted are withheld instead of being smoothed into a misleading total.',
  readings: [
    {
      label: 'Meter history',
      value: 'Validated tail',
      context: 'Continuity check applied before display',
    },
    {
      label: 'Older readings',
      value: 'Withheld',
      context: 'They need a meter-data decision, not interpolation',
    },
    {
      label: 'Cost',
      value: 'Not billed',
      context: 'No water tariff or invoice was present in the import',
    },
  ],
  whatWeAreNotDoing:
    'No floor-plan surveillance or people movement map. Stage 1 is a trustworthy meter record with explicit data-quality boundaries.',
};
