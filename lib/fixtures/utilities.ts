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
  spent: '£1,970 this month',
  benefit: 'Most of that bought useful work in the house',
  plainStory:
    'For a large London house, ~£22–24k / year for electricity is in range. The question is: what ran, was it needed, and did the pounds buy useful outcome or idle waste?',
  readings: [
    {
      label: 'Spend',
      value: '£1,970',
      context: 'This month · ~£455 / week pace',
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
      'Baseload after midnight is above the quiet band for this home (~£40–60 / month if it repeats). Money without a clear job.',
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
  spent: '£220 this month',
  benefit: 'Household use looks intentional · one overnight rise flagged',
  plainStory:
    'Supply + wastewater for a large London house with garden use sits near ~£2.4–2.7k / year. Litres matter as useful use versus loss.',
  readings: [
    {
      label: 'Spend',
      value: '£220',
      context: 'This month · on a ~£2.6k / year pace',
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
      'Flow stepped up for a short window while the house was quiet (~£15–25 if it was a slow leak start). It settled. Still worth confirming.',
    nextStep:
      'Mark as expected, or ask Oriel to keep watching that zone. Confirmation only in this prototype.',
  },
  whatWeAreNotDoing:
    'No floor-plan surveillance, no people movement map. Stage 1 is water spend → use / loss avoided.',
};
