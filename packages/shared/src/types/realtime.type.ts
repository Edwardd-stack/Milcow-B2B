import type { OrderStatus } from '../enums';
import type { PickupInfo } from './pickup.type';

/**
 * Socket.io — namespace "/realtime".
 * Connect with:  io(`${API_ORIGIN}/realtime`, { auth: { token: accessToken } })
 * The server puts each socket into rooms (own member, own warehouse for staff, admin)
 * and pushes these events when something changes.
 */
export const RealtimeEvent = {
  PICKUP_UPDATED: 'pickup.updated',
  ORDER_UPDATED: 'order.updated',
} as const;
export type RealtimeEvent = (typeof RealtimeEvent)[keyof typeof RealtimeEvent];

export type PickupUpdatedPayload = PickupInfo;

export interface OrderUpdatedPayload {
  orderId: string;
  orderStatus: OrderStatus;
  updatedAt: string;
}
