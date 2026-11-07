export const Lang = {
  KO: 'KO',
  EN: 'EN',
  UZ: 'UZ',
} as const;
export type Lang = (typeof Lang)[keyof typeof Lang];

export const DeliveryType = {
  DELIVERY: 'DELIVERY', // Milcow delivers to the buyer's address
  PICKUP: 'PICKUP', // buyer picks up at a warehouse
} as const;
export type DeliveryType = (typeof DeliveryType)[keyof typeof DeliveryType];
