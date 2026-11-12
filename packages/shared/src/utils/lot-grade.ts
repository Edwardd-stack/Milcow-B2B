import type { BacteriaGrade, SomaticGrade } from '../enums';

/**
 * Raw milk hygiene grades used in Korea (원유 위생등급), upper limits per mL.
 * 세균수: 1A < 30,000 · 1B < 100,000 · 2 < 250,000 · 3 < 500,000 · 4 above.
 * 체세포수: 1 < 200,000 · 2 < 350,000 · 3 < 500,000 · 4 < 750,000 · 5 above.
 */
export const BACTERIA_LIMITS: [BacteriaGrade, number][] = [
  ['GRADE_1A', 30_000],
  ['GRADE_1B', 100_000],
  ['GRADE_2', 250_000],
  ['GRADE_3', 500_000],
];
export const SOMATIC_LIMITS: [SomaticGrade, number][] = [
  ['GRADE_1', 200_000],
  ['GRADE_2', 350_000],
  ['GRADE_3', 500_000],
  ['GRADE_4', 750_000],
];

/** Raw milk must be kept at or below this temperature after cooling (°C) */
export const RAW_MILK_MAX_TEMP_C = 5;

export function bacteriaGrade(countPerMl: number): BacteriaGrade {
  return BACTERIA_LIMITS.find(([, limit]) => countPerMl < limit)?.[0] ?? 'GRADE_4';
}

export function somaticGrade(countPerMl: number): SomaticGrade {
  return SOMATIC_LIMITS.find(([, limit]) => countPerMl < limit)?.[0] ?? 'GRADE_5';
}
