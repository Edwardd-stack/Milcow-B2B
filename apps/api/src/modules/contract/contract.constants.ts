import type { ContractStatus } from '@milcow/shared';

/**
 * DRAFT  → REVIEW (buyer submits)  | CANCELLED
 * REVIEW → ACTIVE (admin approves) | CANCELLED
 * ACTIVE → ENDED | CANCELLED
 */
export const CONTRACT_STATUS_FLOW: Record<ContractStatus, ContractStatus[]> = {
  DRAFT: ['REVIEW', 'CANCELLED'],
  REVIEW: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['ENDED', 'CANCELLED'],
  ENDED: [],
  CANCELLED: [],
};

export const CONTRACT_MIN_MONTHS = 1;
export const CONTRACT_MAX_MONTHS = 24;
