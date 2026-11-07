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
