/**
 * Surplus exchange (잉여 원유 매칭) — the price drops as the milk gets older.
 * Every 6 hours since milking: −5 percentage points, never more than −35 %.
 * The API and the web use this SAME function, so the price on screen is the price you pay.
 */
export const SURPLUS_STEP_HOURS = 6;
export const SURPLUS_STEP_PCT = 5;
export const SURPLUS_MAX_PCT = 35;
/** How long a surplus reservation keeps its price before it must be paid */
export const SURPLUS_HOLD_MINUTES = 30;

const HOUR_MS = 60 * 60 * 1000;

export interface SurplusPrice {
  pricePerTon: number; // KRW, rounded to 1,000
  discountPct: number; // 0..SURPLUS_MAX_PCT
  hoursLeft: number; // until useBy (≥ 0, one decimal)
  nextDropAt: string | null; // ISO, null when the floor is reached or the lot expires first
  expired: boolean;
}

export function surplusPrice(
  basePricePerTon: number,
  milkedAt: Date | string,
  useBy: Date | string,
  now: Date = new Date(),
): SurplusPrice {
  const milked = new Date(milkedAt).getTime();
  const end = new Date(useBy).getTime();
  const t = now.getTime();

  const steps = Math.max(0, Math.floor((t - milked) / (SURPLUS_STEP_HOURS * HOUR_MS)));
  const discountPct = Math.min(steps * SURPLUS_STEP_PCT, SURPLUS_MAX_PCT);
  const pricePerTon = Math.round((basePricePerTon * (100 - discountPct)) / 100 / 1000) * 1000;

  const next = milked + (steps + 1) * SURPLUS_STEP_HOURS * HOUR_MS;
  const nextDropAt =
    discountPct < SURPLUS_MAX_PCT && next < end ? new Date(next).toISOString() : null;
  const hoursLeft = Math.max(0, Math.round(((end - t) / HOUR_MS) * 10) / 10);

  return { pricePerTon, discountPct, hoursLeft, nextDropAt, expired: t >= end };
}
