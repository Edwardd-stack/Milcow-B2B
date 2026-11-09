import type { ProductDetail, ProductInfo } from '@milcow/shared';
import type { Prisma } from '../../generated/prisma/client';
import {
  toLocalizedText,
  toLocalizedTextOrNull,
  toNumber,
  toNumberOrNull,
} from '../../libs/utils/convert.util';
import { toFarmSummary } from '../farm/farm.mapper';

// "Include" shapes — which relations each query loads (also used by the service)
export const productListInclude = {
  farm: true,
  inventories: { select: { inventoryTon: true } },
} satisfies Prisma.ProductInclude;

export const productDetailInclude = {
  farm: true,
  inventories: { include: { warehouse: true }, orderBy: { warehouse: { createdAt: 'asc' } } },
} satisfies Prisma.ProductInclude;

type ProductListRow = Prisma.ProductGetPayload<{ include: typeof productListInclude }>;
type ProductDetailRow = Prisma.ProductGetPayload<{ include: typeof productDetailInclude }>;

export function toProductInfo(product: ProductListRow | ProductDetailRow): ProductInfo {
  return {
    id: product.id,
    productType: product.productType,
    productGrade: product.productGrade,
    productStatus: product.productStatus,
    productName: toLocalizedText(product.productName),
    productDesc: toLocalizedTextOrNull(product.productDesc),
    productFatPct: toNumberOrNull(product.productFatPct),
    productProteinPct: toNumberOrNull(product.productProteinPct),
    productPricePerTon: product.productPricePerTon,
    productMinOrderTon: toNumber(product.productMinOrderTon),
    productImages: product.productImages,
    farm: product.farm ? toFarmSummary(product.farm) : null,
    totalStockTon: product.inventories.reduce((sum, row) => sum + toNumber(row.inventoryTon), 0),
  };
}

export function toProductDetail(product: ProductDetailRow): ProductDetail {
  return {
    ...toProductInfo(product),
    stock: product.inventories.map((row) => ({
      warehouseId: row.warehouseId,
      warehouseName: toLocalizedText(row.warehouse.warehouseName),
      inventoryTon: toNumber(row.inventoryTon),
    })),
  };
}
