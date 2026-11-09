import type { Locale } from '@milcow/shared';
import type { Prisma } from '../../../generated/prisma/client';
import { toLocalizedText, toLocalizedTextOrNull } from '../../../libs/utils/convert.util';

/**
 * Turns live database rows into short sentences the AI can read.
 * One row = one chunk: a question about "butter" finds exactly the butter chunk.
 * Labels are translated so a Korean question matches Korean text.
 */

const LABELS = {
  ko: {
    product: '제품',
    grade: '등급',
    fat: '유지방',
    protein: '단백질',
    price: '톤당 가격',
    minOrder: '최소 주문량',
    ton: '톤',
    won: '원',
    perMonth: '월 요금',
    service: '계약 부가 서비스',
    warehouse: '창고',
    farm: '목장',
    address: '주소',
    hours: '운영 시간',
    temp: '보관 온도',
    capacity: '용량',
  },
  en: {
    product: 'Product',
    grade: 'Grade',
    fat: 'Fat',
    protein: 'Protein',
    price: 'Price per ton',
    minOrder: 'Minimum order',
    ton: 'tons',
    won: 'KRW',
    perMonth: 'Monthly fee',
    service: 'Contract add-on service',
    warehouse: 'Warehouse',
    farm: 'Farm',
    address: 'Address',
    hours: 'Opening hours',
    temp: 'Storage temperature',
    capacity: 'Capacity',
  },
  uz: {
    product: 'Mahsulot',
    grade: 'Sifat darajasi',
    fat: "Yog'lilik",
    protein: 'Oqsil',
    price: 'Tonna narxi',
    minOrder: 'Minimal buyurtma',
    ton: 'tonna',
    won: 'von (KRW)',
    perMonth: 'Oylik narx',
    service: "Shartnoma qo'shimcha xizmati",
    warehouse: 'Ombor',
    farm: 'Ferma',
    address: 'Manzil',
    hours: 'Ish vaqti',
    temp: 'Saqlash harorati',
    capacity: "Sig'im",
  },
} satisfies Record<Locale, Record<string, string>>;

const money = (value: number) => value.toLocaleString('en-US');

export type ProductRow = Prisma.ProductGetPayload<{ include: { farm: true } }>;
export type ServicePlanRow = Prisma.ServicePlanGetPayload<object>;
export type WarehouseRow = Prisma.WarehouseGetPayload<object>;

export function productChunk(p: ProductRow, locale: Locale): string {
  const t = LABELS[locale];
  const desc = toLocalizedTextOrNull(p.productDesc)?.[locale];
  return [
    `${t.product}: ${toLocalizedText(p.productName)[locale]} (${p.productType})`,
    `${t.grade}: ${p.productGrade}`,
    p.productFatPct ? `${t.fat}: ${p.productFatPct.toString()}%` : null,
    p.productProteinPct ? `${t.protein}: ${p.productProteinPct.toString()}%` : null,
    `${t.price}: ${money(p.productPricePerTon)} ${t.won}`,
    `${t.minOrder}: ${p.productMinOrderTon.toString()} ${t.ton}`,
    p.farm ? `${t.farm}: ${toLocalizedText(p.farm.farmName)[locale]}` : null,
    desc || null,
  ]
    .filter(Boolean)
    .join('\n');
}

export function servicePlanChunk(s: ServicePlanRow, locale: Locale): string {
  const t = LABELS[locale];
  return [
    `${t.service}: ${toLocalizedText(s.serviceName)[locale]} (${s.serviceType})`,
    `${t.perMonth}: ${money(s.servicePrice)} ${t.won}`,
    toLocalizedTextOrNull(s.serviceDesc)?.[locale] || null,
  ]
    .filter(Boolean)
    .join('\n');
}

export function warehouseChunk(w: WarehouseRow, locale: Locale): string {
  const t = LABELS[locale];
  const hours =
    w.warehouseOpenTime && w.warehouseCloseTime
      ? `${t.hours}: ${w.warehouseOpenTime}–${w.warehouseCloseTime}`
      : null;
  return [
    `${t.warehouse}: ${toLocalizedText(w.warehouseName)[locale]}`,
    `${t.address}: ${w.warehouseAddress}`,
    hours,
    w.warehouseTempC ? `${t.temp}: ${w.warehouseTempC.toString()}°C` : null,
    `${t.capacity}: ${w.warehouseCapacityTon.toString()} ${t.ton}`,
  ]
    .filter(Boolean)
    .join('\n');
}
