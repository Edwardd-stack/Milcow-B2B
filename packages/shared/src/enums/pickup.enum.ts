export const PickupStatus = {
  SCHEDULED: 'SCHEDULED',
  LOADING: 'LOADING',
  READY: 'READY',
  PICKED_UP: 'PICKED_UP',
} as const;
export type PickupStatus = (typeof PickupStatus)[keyof typeof PickupStatus];
