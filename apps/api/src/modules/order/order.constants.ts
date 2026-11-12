import type { DeliveryType, OrderStatus } from '@milcow/shared';

/**
 * Which status may follow which. Anything not listed is rejected.
 *   PENDING → PAID → PREPARING → SHIPPING (delivery) / READY_FOR_PICKUP (pickup) → COMPLETED
 *   PENDING / PAID → CANCELLED
 */
export const ORDER_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['PREPARING', 'CANCELLED'],
  PREPARING: ['SHIPPING', 'READY_FOR_PICKUP'],
  SHIPPING: ['COMPLETED'],
  READY_FOR_PICKUP: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

/** Statuses that only make sense for one delivery type */
export const STATUS_DELIVERY_TYPE: Partial<Record<OrderStatus, DeliveryType>> = {
  SHIPPING: 'DELIVERY',
  READY_FOR_PICKUP: 'PICKUP',
};

export const MAX_ITEMS_PER_ORDER = 20;
