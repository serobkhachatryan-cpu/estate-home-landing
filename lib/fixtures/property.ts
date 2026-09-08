export const demoUser = {
  name: 'Timur',
  firstName: 'Timur',
  initials: 'T',
} as const;

/** First concrete pilot home — not a marketing estate demo. */
export const demoProperty = {
  id: 'timur-home',
  name: "Timur's home",
  area: 'London pilot',
  label: "Timur's home · London pilot",
  isDemo: true,
  overallHealth: 'normal' as const,
  overallHealthLabel: 'Everything looks normal',
  lastVerified: 'Updated for this discussion',
} as const;

export const notifications = [
  {
    id: 'n1',
    title: 'Water overnight rise',
    detail: 'Brief unusual flow — worth a look in Water.',
    time: 'Yesterday',
  },
  {
    id: 'n2',
    title: 'Electricity idle load',
    detail: 'Standby still a little high overnight.',
    time: '2 days ago',
  },
] as const;
