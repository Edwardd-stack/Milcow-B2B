import type { LocalizedText } from '@milcow/shared';
import type { Prisma } from '../../generated/prisma/client';

/** Prisma Json column → { ko, en, uz }. Missing languages fall back to Korean. */
export function toLocalizedText(value: Prisma.JsonValue): LocalizedText {
  const v = (value ?? {}) as Partial<Record<keyof LocalizedText, unknown>>;
  const ko = typeof v.ko === 'string' ? v.ko : '';
  return {
    ko,
    en: typeof v.en === 'string' ? v.en : ko,
    uz: typeof v.uz === 'string' ? v.uz : ko,
  };
}

export function toLocalizedTextOrNull(value: Prisma.JsonValue | null): LocalizedText | null {
  return value === null ? null : toLocalizedText(value);
}

/** Prisma Decimal (sent as a string in JSON) → plain number for the API */
export function toNumber(value: Prisma.Decimal): number {
  return value.toNumber();
}

export function toNumberOrNull(value: Prisma.Decimal | null): number | null {
  return value === null ? null : value.toNumber();
}
