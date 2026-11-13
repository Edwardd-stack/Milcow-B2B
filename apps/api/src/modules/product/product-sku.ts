import type { ProductType } from '@milcow/shared';
import type { Prisma, PrismaClient } from '../../generated/prisma/client';

/** SKU = MC-{type}-{0001}: readable, sortable, unique. Assigned by the server, never typed by hand. */
export const SKU_PREFIX: Record<ProductType, string> = {
  RAW_MILK: 'RAW',
  CREAM: 'CRM',
  BUTTER: 'BTR',
  CHEESE: 'CHS',
  YOGURT: 'YGT',
  MILK_POWDER: 'PWD',
};

export const formatSku = (type: ProductType, n: number) =>
  `MC-${SKU_PREFIX[type]}-${String(n).padStart(4, '0')}`;

/** Next free SKU for a product type (highest existing number + 1) */
export async function nextSku(db: PrismaClient | Prisma.TransactionClient, type: ProductType) {
  const prefix = `MC-${SKU_PREFIX[type]}-`;
  const last = await db.product.findFirst({
    where: { productSku: { startsWith: prefix } },
    orderBy: { productSku: 'desc' },
    select: { productSku: true },
  });
  const n = last?.productSku ? Number(last.productSku.slice(prefix.length)) : 0;
  return formatSku(type, n + 1);
}
