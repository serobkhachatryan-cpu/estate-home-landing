import type { ConditionState, DecisionStatus, SystemId } from './types';

export type GlanceMetric = {
  id: string;
  label: string;
  value: string;
  comparison: string;
  explanation: string;
};

export type DecisionItem = {
  id: string;
  title: string;
  summary: string;
  detail: string;
  impact: string;
  urgency: 'routine' | 'timely';
  demoLabel: string;
  confirmLabel: string;
  deferLabel: string;
};

export type SystemSummary = {
  id: SystemId;
  name: string;
  condition: ConditionState;
  conditionLabel: string;
  reading: string;
  lastUpdated: string;
  watching: string;
};

export type DaySpend = {
  day: string;
  electricity: number;
  heating: number;
  maintenance: number;
};

export type ActivityEvent = {
  id: string;
  title: string;
  detail: string;
  time: string;
  category: 'service' | 'protection' | 'schedule' | 'decision';
};

export const overviewSummary =
  'Carlton Hill is operating normally. First: see what you spent and what benefit that spend returned—then review the two decisions waiting.';

export const glanceMetrics: GlanceMetric[] = [
  {
    id: 'spend',
    label: 'Operating spend',
    value: '£3,575',
    comparison: '£180 above last month at this point',
    explanation:
      'Month-to-date controllable slice: electricity, heating fuel, water and planned maintenance (~£38k / month whole-home opex).',
  },
  {
    id: 'energy',
    label: 'Energy use',
    value: '1,650 kWh',
    comparison: '4% above the same week last year',
    explanation:
      'Whole-home electricity for the last seven days (~£455), including standby loads Oriel is watching.',
  },
  {
    id: 'fuel',
    label: 'Heating fuel',
    value: '64%',
    comparison: '≈18 days at current rate',
    explanation:
      'Oil tank level with an estimated run-rate based on recent outdoor temperatures and occupancy.',
  },
  {
    id: 'water',
    label: 'Water',
    value: 'Stable',
    comparison: 'No unusual overnight flow',
    explanation:
      'Supply pressure and overnight baseline look consistent with an empty house overnight.',
  },
  {
    id: 'security',
    label: 'Security',
    value: 'Secure',
    comparison: '1 access exception to review',
    explanation:
      'Perimeter and alarms are armed as scheduled. One gate entry sits outside the usual pattern.',
  },
];

export const decisions: DecisionItem[] = [
  {
    id: 'boiler-service',
    title: 'Approve planned boiler service',
    summary:
      'Annual service is due before the colder weeks. Quote is within the usual planned range.',
    detail:
      'Oriel has lined up the scheduled boiler service for Carlton Hill. The quote covers inspection, cleaning and a safety check. Approving books the visit; deferring keeps the reminder open without cancelling monitoring.',
    impact: 'Quoted £420 · Planned maintenance',
    urgency: 'timely',
    demoLabel: 'Demo action',
    confirmLabel: 'Approve service',
    deferLabel: 'Defer for now',
  },
  {
    id: 'heating-threshold',
    title: 'Choose overnight heating threshold',
    summary:
      'Suggest holding bedrooms at 16°C when the house is empty overnight, rather than 18°C.',
    detail:
      'Recent occupancy shows the residence is usually empty between 23:30 and 06:30. Holding a lower overnight threshold reduces fuel use without affecting morning comfort once schedules resume.',
    impact: 'Est. £38–£55 / month in colder weather',
    urgency: 'routine',
    demoLabel: 'Demo action',
    confirmLabel: 'Apply 16°C overnight',
    deferLabel: 'Keep current setting',
  },
  {
    id: 'gate-access',
    title: 'Review gate-access exception',
    summary:
      'A vehicle entered at 01:14 on Sunday outside the usual schedule. No alarm was raised.',
    detail:
      'The main gate logged an authorised credential outside the expected overnight window. Oriel did not escalate because the credential is valid; confirming this exception clears the item from your decision list.',
    impact: 'Security review · No forced entry',
    urgency: 'routine',
    demoLabel: 'Demo action',
    confirmLabel: 'Mark as expected',
    deferLabel: 'Ask Oriel to watch',
  },
];

export const systemSummaries: SystemSummary[] = [
  {
    id: 'climate',
    name: 'Climate',
    condition: 'normal',
    conditionLabel: 'Settled',
    reading: '19.5°C average · Heating on schedule',
    lastUpdated: '12 min ago',
    watching: 'Occupancy-aligned setpoints and overnight hold.',
  },
  {
    id: 'power',
    name: 'Power',
    condition: 'normal',
    conditionLabel: 'Quiet',
    reading: '1.8 kW now · Standby within band',
    lastUpdated: '8 min ago',
    watching: 'Baseload drift and unusual daytime peaks.',
  },
  {
    id: 'water',
    name: 'Water',
    condition: 'watch',
    conditionLabel: 'Watching',
    reading: 'Pressure steady · Overnight flow normal',
    lastUpdated: '22 min ago',
    watching: 'Slow-leak signatures on the garden and plant room lines.',
  },
  {
    id: 'security',
    name: 'Security',
    condition: 'attention',
    conditionLabel: 'Needs review',
    reading: 'Armed · 1 access exception',
    lastUpdated: '35 min ago',
    watching: 'Gate, perimeter and scheduled occupancy windows.',
  },
  {
    id: 'network',
    name: 'Network',
    condition: 'normal',
    conditionLabel: 'Stable',
    reading: 'Uplink healthy · Plant room online',
    lastUpdated: '5 min ago',
    watching: 'Connectivity for monitoring and scheduled automations.',
  },
];

export const weekSpend: DaySpend[] = [
  { day: 'Mon', electricity: 42, heating: 58, maintenance: 0 },
  { day: 'Tue', electricity: 39, heating: 61, maintenance: 0 },
  { day: 'Wed', electricity: 44, heating: 55, maintenance: 120 },
  { day: 'Thu', electricity: 41, heating: 63, maintenance: 0 },
  { day: 'Fri', electricity: 46, heating: 59, maintenance: 0 },
  { day: 'Sat', electricity: 51, heating: 48, maintenance: 0 },
  { day: 'Sun', electricity: 48, heating: 52, maintenance: 0 },
];

export const recentActivity: ActivityEvent[] = [
  {
    id: 'a1',
    title: 'Plant-room filter service completed',
    detail: 'Contractor visit closed. Next check in six months.',
    time: 'Today, 09:40',
    category: 'service',
  },
  {
    id: 'a2',
    title: 'Leak risk avoided on garden supply',
    detail: 'Overnight flow rose briefly; Oriel held the zone and it settled.',
    time: 'Yesterday, 03:12',
    category: 'protection',
  },
  {
    id: 'a3',
    title: 'Occupancy schedule adjusted',
    detail: 'Weekday evening return moved to 19:15 after recent patterns.',
    time: 'Sunday',
    category: 'schedule',
  },
];

export type DecisionStateMap = Record<string, DecisionStatus>;

export const initialDecisionStates: DecisionStateMap = {
  'boiler-service': 'pending',
  'heating-threshold': 'pending',
  'gate-access': 'pending',
};
