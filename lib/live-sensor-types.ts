/** Browser-safe current states from the owner-operated Home Assistant bridge. */
export type LiveSensorGroupId =
  | 'power'
  | 'water'
  | 'fuel'
  | 'climate'
  | 'security'
  | 'network'
  | 'care'
  | 'sensors';

export type LiveSensorReading = {
  entityId: string;
  groupId: LiveSensorGroupId;
  label: string;
  state: string;
  unit: string | null;
  stateUpdatedAt: string;
  observedAt: string;
};

export type LiveSensorSnapshotResponse = {
  status: 'available' | 'not_configured';
  readings: LiveSensorReading[];
  detail: string;
};
