export const ProductType = {
  RAW_MILK: 'RAW_MILK',
  CREAM: 'CREAM',
  BUTTER: 'BUTTER',
  CHEESE: 'CHEESE',
  YOGURT: 'YOGURT',
  MILK_POWDER: 'MILK_POWDER',
} as const;
export type ProductType = (typeof ProductType)[keyof typeof ProductType];

export const ProductGrade = {
  PREMIUM: 'PREMIUM',
  GRADE_1: 'GRADE_1', // 1등급
  GRADE_2: 'GRADE_2', // 2등급
} as const;
export type ProductGrade = (typeof ProductGrade)[keyof typeof ProductGrade];

export const ProductStatus = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
} as const;
export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];

/** Sort options for GET /products */
export const ProductSort = {
  NEWEST: 'NEWEST',
  PRICE_ASC: 'PRICE_ASC',
  PRICE_DESC: 'PRICE_DESC',
} as const;
export type ProductSort = (typeof ProductSort)[keyof typeof ProductSort];
