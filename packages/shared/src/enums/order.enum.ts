export const OrderStatus = {
  PENDING: 'PENDING', // created, waiting for payment
  PAID: 'PAID',
  PREPARING: 'PREPARING',
  SHIPPING: 'SHIPPING', // DELIVERY only
  READY_FOR_PICKUP: 'READY_FOR_PICKUP', // PICKUP only
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

/** Order history entries (admin timeline) */
export const OrderEventType = {
  CREATED: 'CREATED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
  PICKUP_STEP: 'PICKUP_STEP',
} as const;
export type OrderEventType = (typeof OrderEventType)[keyof typeof OrderEventType];
