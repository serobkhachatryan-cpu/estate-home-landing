export type ActivityFeedItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  category: 'service' | 'protection' | 'schedule' | 'decision' | 'spend';
};

export const activityFeed: ActivityFeedItem[] = [
  {
    id: 'f1',
    title: 'Plant-room filter service completed',
    detail: 'Contractor visit closed at £180. Next check in six months.',
    time: 'Today, 09:40',
    category: 'service',
  },
  {
    id: 'f2',
    title: 'Leak risk avoided on garden supply',
    detail: 'Overnight flow rose briefly; Oriel held the zone and it settled.',
    time: 'Yesterday, 03:12',
    category: 'protection',
  },
  {
    id: 'f3',
    title: 'Occupancy schedule adjusted',
    detail: 'Weekday evening return moved to 19:15 after recent patterns.',
    time: 'Sunday',
    category: 'schedule',
  },
  {
    id: 'f4',
    title: 'Boiler service quote prepared',
    detail: 'Annual service quote of £420 is waiting for your decision.',
    time: 'Saturday',
    category: 'decision',
  },
  {
    id: 'f5',
    title: 'Operating spend tracking below prior month',
    detail:
      'Month-to-date controllable spend is £210 quieter than this point last month.',
    time: 'Friday',
    category: 'spend',
  },
  {
    id: 'f6',
    title: 'Network failover tested',
    detail:
      'Failover path verified without interrupting household connectivity.',
    time: '12 days ago',
    category: 'service',
  },
];
