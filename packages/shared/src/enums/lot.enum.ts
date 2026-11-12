/** 세균수 grade of raw milk (per mL). 1A is the best. */
export const BacteriaGrade = {
  GRADE_1A: 'GRADE_1A',
  GRADE_1B: 'GRADE_1B',
  GRADE_2: 'GRADE_2',
  GRADE_3: 'GRADE_3',
  GRADE_4: 'GRADE_4',
} as const;
export type BacteriaGrade = (typeof BacteriaGrade)[keyof typeof BacteriaGrade];

/** 체세포수 grade of raw milk (per mL) — tells how healthy the cows are. 1 is the best. */
export const SomaticGrade = {
  GRADE_1: 'GRADE_1',
  GRADE_2: 'GRADE_2',
  GRADE_3: 'GRADE_3',
  GRADE_4: 'GRADE_4',
  GRADE_5: 'GRADE_5',
} as const;
export type SomaticGrade = (typeof SomaticGrade)[keyof typeof SomaticGrade];

export const AntibioticResult = {
  NEGATIVE: 'NEGATIVE',
  POSITIVE: 'POSITIVE',
} as const;
export type AntibioticResult = (typeof AntibioticResult)[keyof typeof AntibioticResult];

export const LotStatus = {
  IN_STOCK: 'IN_STOCK',
  SOLD_OUT: 'SOLD_OUT',
  EXPIRED: 'EXPIRED',
} as const;
export type LotStatus = (typeof LotStatus)[keyof typeof LotStatus];

/** Stages in a lot's cold-chain temperature log */
export const TempStage = {
  MILKING: 'MILKING', // 착유 직후 (body temperature)
  FARM_TANK: 'FARM_TANK', // 목장 냉각 탱크
  TRANSPORT: 'TRANSPORT', // 집유차
  WAREHOUSE: 'WAREHOUSE', // 창고 보관
} as const;
export type TempStage = (typeof TempStage)[keyof typeof TempStage];
