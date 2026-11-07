/** Mirrors Toss Payments statuses that Milcow uses. */
export const PaymentStatus = {
  READY: 'READY',
  DONE: 'DONE',
  CANCELED: 'CANCELED',
  FAILED: 'FAILED',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];
