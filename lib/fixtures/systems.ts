import type { ConditionState, SystemId } from './types';

export type SystemDetail = {
  id: SystemId;
  name: string;
  condition: ConditionState;
  conditionLabel: string;
  summary: string;
  watching: string;
  lastVerified: string;
  readings: { label: string; value: string; note: string }[];
  pattern: { label: string; value: number }[];
  thresholds: { label: string; value: string; status: string }[];
  nextMaintenance: { title: string; when: string; owner: string };
  automations: { id: string; title: string; detail: string; state: string }[];
};

export const systemsCatalogue: SystemDetail[] = [
  {
    id: 'climate',
    name: 'Climate',
    condition: 'normal',
    conditionLabel: 'Settled',
    summary:
      'Heating is following the occupancy schedule. Indoor temperatures are within the agreed comfort band.',
    watching:
      'Oriel watches setpoint drift, overnight holds and whether plant runtime matches the weather.',
    lastVerified: 'Verified 12 minutes ago',
    readings: [
      {
        label: 'Average indoor',
        value: '19.5°C',
        note: 'Across occupied floors',
      },
      {
        label: 'Overnight hold',
        value: '18°C',
        note: 'Pending decision to move to 16°C',
      },
      {
        label: 'Boiler runtime today',
        value: '3.4 h',
        note: 'Within expected band',
      },
    ],
    pattern: [
      { label: 'Mon', value: 19.2 },
      { label: 'Tue', value: 19.4 },
      { label: 'Wed', value: 19.6 },
      { label: 'Thu', value: 19.5 },
      { label: 'Fri', value: 19.8 },
      { label: 'Sat', value: 20.1 },
      { label: 'Sun', value: 19.7 },
    ],
    thresholds: [
      { label: 'Day comfort band', value: '19–21°C', status: 'Within band' },
      { label: 'Overnight hold', value: '18°C', status: 'Review suggested' },
      { label: 'Frost protection', value: '12°C', status: 'Armed' },
    ],
    nextMaintenance: {
      title: 'Annual boiler service',
      when: 'Quoted · awaiting approval',
      owner: 'Contractor via Oriel',
    },
    automations: [
      {
        id: 'climate-occupancy',
        title: 'Occupancy-aligned heating',
        detail:
          'Setpoints follow the weekly schedule Oriel refined from recent patterns.',
        state: 'Reviewed automation',
      },
      {
        id: 'climate-overnight',
        title: 'Overnight threshold',
        detail:
          'A lower overnight hold is suggested; change requires your confirmation.',
        state: 'Request a change',
      },
    ],
  },
  {
    id: 'power',
    name: 'Power & fuel',
    condition: 'normal',
    conditionLabel: 'Quiet',
    summary:
      'Electricity demand is calm for a weekday. Oil stock is sufficient for the near term at the current burn rate.',
    watching:
      'Oriel watches baseload, unexpected peaks and fuel run-rate against weather.',
    lastVerified: 'Verified 8 minutes ago',
    readings: [
      { label: 'Live draw', value: '1.8 kW', note: 'No unusual peak' },
      { label: 'Oil tank', value: '64%', note: '≈18 days at current rate' },
      {
        label: 'Standby overnight',
        value: '0.42 kW',
        note: 'Within quiet band',
      },
    ],
    pattern: [
      { label: 'Mon', value: 42 },
      { label: 'Tue', value: 39 },
      { label: 'Wed', value: 44 },
      { label: 'Thu', value: 41 },
      { label: 'Fri', value: 46 },
      { label: 'Sat', value: 51 },
      { label: 'Sun', value: 48 },
    ],
    thresholds: [
      { label: 'Daytime peak watch', value: '6.5 kW', status: 'Clear' },
      {
        label: 'Overnight baseload',
        value: '0.55 kW max',
        status: 'Within band',
      },
      { label: 'Fuel low mark', value: '25%', status: 'Above mark' },
    ],
    nextMaintenance: {
      title: 'Generator test run',
      when: 'Scheduled in 5 weeks',
      owner: 'Oriel',
    },
    automations: [
      {
        id: 'power-standby',
        title: 'Standby watch',
        detail:
          'Idle circuits are observed; changes are requested, not toggled live.',
        state: 'Reviewed automation',
      },
    ],
  },
  {
    id: 'water',
    name: 'Water',
    condition: 'watch',
    conditionLabel: 'Watching',
    summary:
      'Pressure is steady and overnight flow looks normal after a brief garden-line rise was caught.',
    watching:
      'Oriel watches overnight baselines, pressure dips and zones that historically leaked slowly.',
    lastVerified: 'Verified 22 minutes ago',
    readings: [
      {
        label: 'Supply pressure',
        value: '2.8 bar',
        note: 'Stable through the morning',
      },
      { label: 'Overnight flow', value: 'Normal', note: 'No sustained rise' },
      {
        label: 'Plant room humidity',
        value: '41%',
        note: 'Within expected range',
      },
    ],
    pattern: [
      { label: 'Mon', value: 12 },
      { label: 'Tue', value: 11 },
      { label: 'Wed', value: 18 },
      { label: 'Thu', value: 10 },
      { label: 'Fri', value: 11 },
      { label: 'Sat', value: 14 },
      { label: 'Sun', value: 13 },
    ],
    thresholds: [
      {
        label: 'Overnight flow watch',
        value: 'Above quiet baseline',
        status: 'Clear now',
      },
      { label: 'Pressure floor', value: '2.2 bar', status: 'Above floor' },
      {
        label: 'Freeze risk',
        value: 'Plant & external lines',
        status: 'Not active',
      },
    ],
    nextMaintenance: {
      title: 'Garden supply joint check',
      when: 'Monitored · visit if pattern returns',
      owner: 'Oriel',
    },
    automations: [
      {
        id: 'water-overnight',
        title: 'Overnight flow watch',
        detail:
          'Unusual overnight flow can pause a zone after confirmation rules are met.',
        state: 'Reviewed automation',
      },
      {
        id: 'water-isolate',
        title: 'Request isolation change',
        detail:
          'Manual isolation requests are confirmed before anything is actioned.',
        state: 'Request a change',
      },
    ],
  },
  {
    id: 'security',
    name: 'Security & perimeter',
    condition: 'attention',
    conditionLabel: 'Needs review',
    summary:
      'The house is armed as scheduled. One gate entry sits outside the usual overnight window.',
    watching:
      'Oriel watches access exceptions, perimeter state and occupancy mismatches.',
    lastVerified: 'Verified 35 minutes ago',
    readings: [
      { label: 'Alarm state', value: 'Armed', note: 'Night schedule active' },
      { label: 'Gate', value: 'Secure', note: '1 exception to review' },
      { label: 'Perimeter', value: 'Quiet', note: 'No forced events' },
    ],
    pattern: [
      { label: 'Mon', value: 2 },
      { label: 'Tue', value: 1 },
      { label: 'Wed', value: 2 },
      { label: 'Thu', value: 1 },
      { label: 'Fri', value: 3 },
      { label: 'Sat', value: 4 },
      { label: 'Sun', value: 2 },
    ],
    thresholds: [
      {
        label: 'Expected overnight access',
        value: 'None',
        status: '1 exception',
      },
      { label: 'Disarm window', value: '06:30–23:30', status: 'On schedule' },
    ],
    nextMaintenance: {
      title: 'Gate motor service',
      when: 'Due in 3 months',
      owner: 'Contractor via Oriel',
    },
    automations: [
      {
        id: 'security-schedule',
        title: 'Arming schedule',
        detail:
          'Arming follows occupancy. Changes are requested with confirmation.',
        state: 'Reviewed automation',
      },
    ],
  },
  {
    id: 'network',
    name: 'Network',
    condition: 'normal',
    conditionLabel: 'Stable',
    summary:
      'Monitoring uplinks are healthy. Plant-room connectivity is intact for scheduled automations.',
    watching:
      'Oriel watches uplink health and whether critical plant remains reachable.',
    lastVerified: 'Verified 5 minutes ago',
    readings: [
      {
        label: 'Primary uplink',
        value: 'Healthy',
        note: 'No packet loss of concern',
      },
      {
        label: 'Plant room',
        value: 'Online',
        note: 'Last heartbeat 1 min ago',
      },
      { label: 'Failover', value: 'Ready', note: 'Last tested 12 days ago' },
    ],
    pattern: [
      { label: 'Mon', value: 99 },
      { label: 'Tue', value: 100 },
      { label: 'Wed', value: 99 },
      { label: 'Thu', value: 100 },
      { label: 'Fri', value: 100 },
      { label: 'Sat', value: 99 },
      { label: 'Sun', value: 100 },
    ],
    thresholds: [
      {
        label: 'Uplink availability',
        value: '99% target',
        status: 'Meeting target',
      },
      { label: 'Plant heartbeat', value: '< 5 min', status: 'Meeting target' },
    ],
    nextMaintenance: {
      title: 'Failover test',
      when: 'Scheduled in 2 weeks',
      owner: 'Oriel',
    },
    automations: [
      {
        id: 'network-failover',
        title: 'Failover readiness',
        detail:
          'Failover is tested on a schedule; live cutover is never silent.',
        state: 'Reviewed automation',
      },
    ],
  },
];

export function getSystem(id: SystemId): SystemDetail | undefined {
  return systemsCatalogue.find((system) => system.id === id);
}
