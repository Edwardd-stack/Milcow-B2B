import type { WarehouseInfo } from '@milcow/shared';
import type { Warehouse } from '../../generated/prisma/client';
import { toLocalizedText, toNumber, toNumberOrNull } from '../../libs/utils/convert.util';

export function toWarehouseInfo(warehouse: Warehouse): WarehouseInfo {
  return {
    id: warehouse.id,
    warehouseName: toLocalizedText(warehouse.warehouseName),
    warehouseAddress: warehouse.warehouseAddress,
    warehouseLat: warehouse.warehouseLat,
    warehouseLng: warehouse.warehouseLng,
    warehouseCapacityTon: toNumber(warehouse.warehouseCapacityTon),
    warehouseTempC: toNumberOrNull(warehouse.warehouseTempC),
    warehouseOpenTime: warehouse.warehouseOpenTime,
    warehouseCloseTime: warehouse.warehouseCloseTime,
  };
}
