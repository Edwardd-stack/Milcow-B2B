export const ContractStatus = {
  DRAFT: 'DRAFT', // AI draft, editable by the buyer
  REVIEW: 'REVIEW', // submitted, waiting for admin
  ACTIVE: 'ACTIVE', // monthly orders are generated
  ENDED: 'ENDED',
  CANCELLED: 'CANCELLED',
} as const;
export type ContractStatus = (typeof ContractStatus)[keyof typeof ContractStatus];

export const ServiceType = {
  COLD_CHAIN: 'COLD_CHAIN',
  QUALITY_TEST: 'QUALITY_TEST',
  PRICE_LOCK: 'PRICE_LOCK',
  PRIORITY_SUPPLY: 'PRIORITY_SUPPLY',
  FREE_PICKUP: 'FREE_PICKUP',
} as const;
export type ServiceType = (typeof ServiceType)[keyof typeof ServiceType];

export const ServiceStatus = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
} as const;
export type ServiceStatus = (typeof ServiceStatus)[keyof typeof ServiceStatus];
