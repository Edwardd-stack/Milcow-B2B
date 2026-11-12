import type { ProductGrade, ProductStatus, ProductType } from '../enums';
import type { LocalizedText } from './common.type';
import type { FarmSummary } from './farm.type';

/** GET /products (list item) */
export interface ProductInfo {
  id: string;
  productType: ProductType;
  productGrade: ProductGrade;
  productStatus: ProductStatus;
  productName: LocalizedText;
  productDesc: LocalizedText | null;
  productFatPct: number | null;
  productProteinPct: number | null;
  productPricePerTon: number; // KRW
  productMinOrderTon: number;
  productImages: string[];
  farm: FarmSummary | null;
  totalStockTon: number; // sum over all warehouses
}

/** GET /products/:id — adds stock per warehouse */
export interface ProductDetail extends ProductInfo {
  stock: {
    warehouseId: string;
    warehouseName: LocalizedText;
    inventoryTon: number;
  }[];
}

/** GET /products/facets — numbers for the catalog filters */
export interface ProductFacets {
  total: number;
  byType: Record<ProductType, number>;
  priceMin: number; // KRW per ton
  priceMax: number;
}

/** GET /products/:id/neighbors — previous / next product in the catalog's default (recommended) order */
export interface ProductNeighbors {
  prevId: string | null; // null on the first product
  nextId: string | null; // null on the last product
  position: number; // 1-based
  total: number;
}
