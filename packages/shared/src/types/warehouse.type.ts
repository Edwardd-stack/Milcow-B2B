import type { LocalizedText } from './common.type';

/** GET /warehouses — map markers and pickup locations */
export interface WarehouseInfo {
  id: string;
  warehouseName: LocalizedText;
  warehouseAddress: string;
  warehouseLat: number;
  warehouseLng: number;
  warehouseCapacityTon: number;
  warehouseTempC: number | null;
  warehouseOpenTime: string | null;
  warehouseCloseTime: string | null;
}
