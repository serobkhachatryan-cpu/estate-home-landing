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
  statusLabel: 'Needs a look',
  status: 'exception',
  spent: '£980 this month',
  benefit: 'Most of that bought useful work in the house',
  plainStory:
    'Consumption alone is not the point. The question is: what ran, was it needed, and did the pounds buy useful outcome or idle waste?',
  readings: [
    {
      label: 'Spend',
      value: '£980',
      context: 'Month to date · controllable',
    },
    {
      label: 'Useful share',
      value: '~92%',
      context: 'Aligned to how the house is used',
    },
    {
      label: 'Idle overnight',
      value: 'A little high',
      context: 'Exception · circuits that may not need to stay awake',
    },
  ],
  exception: {
    title: 'Overnight standby a little high',
    detail:
      'Baseload after midnight is above the quiet band for this home. Repeated every night, that is money without a clear job.',
    nextStep:
      'Confirm which circuits must stay on. No live toggles in this prototype — decision only.',
  },
  whatWeAreNotDoing:
    'No camera feeds, no people-tracking, no per-bulb toy controls. Stage 1 is spend → benefit for power.',
};

export const waterDetail: UtilityDetail = {
  id: 'water',
  name: 'Water',
  statusLabel: 'Needs a look',
  status: 'exception',
  spent: '£90 this month',
  benefit: 'Household use looks intentional · one overnight rise flagged',
  plainStory:
    'Litres matter only as useful use versus loss. The job of this screen is to show whether the bill bought normal living — or waste and risk.',
  readings: [
    {
      label: 'Spend',
      value: '£90',
      context: 'Month to date',
    },
    {
      label: 'Daytime use',
      value: 'Normal',
      context: 'Matches how the house is occupied',
    },
    {
      label: 'Overnight',
      value: 'One brief rise',
      context: 'Exception · could be nothing or a slow leak start',
    },
  ],
  exception: {
    title: 'Brief overnight flow rise',
    detail:
      'Flow stepped up for a short window while the house was quiet. It settled. Still worth confirming so spend stays useful.',
    nextStep:
      'Mark as expected, or ask Oriel to keep watching that zone. Confirmation only in this prototype.',
  },
  whatWeAreNotDoing:
    'No floor-plan surveillance, no people movement map. Stage 1 is water spend → use / loss avoided.',
};
