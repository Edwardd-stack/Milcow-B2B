import type { OrderStatus, PickupStatus } from '@milcow/shared';

/** SCHEDULED → LOADING → READY → PICKED_UP (warehouse staff moves it forward) */
export const PICKUP_STATUS_FLOW: Record<PickupStatus, PickupStatus[]> = {
  SCHEDULED: ['LOADING'],
  LOADING: ['READY'],
  READY: ['PICKED_UP'],
  PICKED_UP: [],
};

/**
 * Pickup progress also moves the order:
 *   LOADING   needs a paid order → order PREPARING
 *   READY     → order READY_FOR_PICKUP
 *   PICKED_UP → order COMPLETED
 */
export const PICKUP_ORDER_SYNC: Record<
  Exclude<PickupStatus, 'SCHEDULED'>,
  { requires: OrderStatus[]; next: OrderStatus }
> = {
  LOADING: { requires: ['PAID', 'PREPARING'], next: 'PREPARING' },
  READY: { requires: ['PREPARING'], next: 'READY_FOR_PICKUP' },
  PICKED_UP: { requires: ['READY_FOR_PICKUP'], next: 'COMPLETED' },
};
