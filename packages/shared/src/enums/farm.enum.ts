export const FarmCertification = {
  HACCP: 'HACCP',
  ORGANIC: 'ORGANIC',
  ANIMAL_WELFARE: 'ANIMAL_WELFARE', // 동물복지
} as const;
export type FarmCertification = (typeof FarmCertification)[keyof typeof FarmCertification];
