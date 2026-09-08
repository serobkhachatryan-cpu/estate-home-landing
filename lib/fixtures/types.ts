export type ConditionState = 'normal' | 'watch' | 'attention' | 'offline';

export type Responsibility = 'Oriel' | 'Homeowner' | 'Contractor';

export type DecisionStatus = 'pending' | 'approved' | 'deferred' | 'completed';

export type SpendCategory =
  | 'electricity'
  | 'heating'
  | 'standby'
  | 'water'
  | 'maintenance';

export type TimeRange = 'mtd' | '30d' | '90d' | '12m';

export type SystemId = 'climate' | 'power' | 'water' | 'security' | 'network';
