import type { Responsibility } from './types';

export type MaintenanceStatus =
  | 'scheduled'
  | 'monitoring'
  | 'quoted'
  | 'completed'
  | 'deferred';

export type MaintenanceItem = {
  id: string;
  title: string;
  when: string;
  status: MaintenanceStatus;
  responsibility: Responsibility;
  cost?: string;
  context: string;
};

export const maintenancePlan: MaintenanceItem[] = [
  {
    id: 'boiler-quote',
    title: 'Annual boiler service',
    when: 'Preferred window: next 10 days',
    status: 'quoted',
    responsibility: 'Contractor',
    cost: '£420 quoted',
    context:
      'Safety check, cleaning and inspection before colder weather. Approve or defer in this prototype.',
  },
  {
    id: 'generator-test',
    title: 'Standby generator test run',
    when: '5 weeks',
    status: 'scheduled',
    responsibility: 'Oriel',
    context:
      'Monthly confidence run under load, logged against last winter performance.',
  },
  {
    id: 'gate-service',
    title: 'Gate motor service',
    when: 'In 3 months',
    status: 'scheduled',
    responsibility: 'Contractor',
    context:
      'Preventive service on the main carriage gate before heavier winter use.',
  },
  {
    id: 'garden-line',
    title: 'Garden supply joint',
    when: 'Monitored',
    status: 'monitoring',
    responsibility: 'Oriel',
    context:
      'A brief overnight rise was caught and settled. Oriel continues watching before booking a visit.',
  },
  {
    id: 'filter-done',
    title: 'Plant-room filter service',
    when: 'Completed today',
    status: 'completed',
    responsibility: 'Contractor',
    cost: '£180',
    context: 'Filter replaced and airflow restored. Next check in six months.',
  },
  {
    id: 'network-failover',
    title: 'Network failover test',
    when: 'Completed 12 days ago',
    status: 'completed',
    responsibility: 'Oriel',
    cost: 'Included',
    context:
      'Failover path verified without interrupting household connectivity.',
  },
];
