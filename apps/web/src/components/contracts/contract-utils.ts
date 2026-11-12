import type { DeliveryType } from '@milcow/shared';

/** What the contract "paper" edits. `months` instead of an end date: easier to change. */
export interface EditableContract {
  productId: string;
  warehouseId: string;
  start: string; // YYYY-MM-DD
  months: number;
  ton: number;
  deliveryType: DeliveryType;
  address: string;
  serviceIds: string[];
}

export const MAX_MONTHS = 24; // same as CONTRACT_MAX_MONTHS in the API

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Monthly delivery dates from `start`, `count` times, on the same day of the month
 * (31st → last day of shorter months). Same rule as the API's monthlyDates().
 */
export function monthlyDates(start: string, count: number): string[] {
  const [year = 0, month = 1, day = 1] = start.split('-').map(Number);
  return Array.from({ length: Math.max(0, count) }, (_, i) => {
    const y = year + Math.floor((month - 1 + i) / 12);
    const m = ((month - 1 + i) % 12) + 1;
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return `${y}-${pad(m)}-${pad(Math.min(day, daysInMonth))}`;
  });
}

/** Today in Korea as YYYY-MM-DD (contracts run on Korean calendar days) */
export function todayKst() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
}

/** 1st of next month — a sensible default first delivery */
export function firstOfNextMonth() {
  const [y = 0, m = 1] = todayKst().split('-').map(Number);
  return m === 12 ? `${y + 1}-01-01` : `${y}-${pad(m + 1)}-01`;
}
