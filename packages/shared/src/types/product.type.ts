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
