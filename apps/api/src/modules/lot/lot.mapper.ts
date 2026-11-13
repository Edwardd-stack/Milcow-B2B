import {
  surplusPrice,
  type LotPassport,
  type LotSummary,
  type LotTempPoint,
  type SurplusLot,
} from '@milcow/shared';
import type { Prisma } from '../../generated/prisma/client';
import { toLocalizedText, toNumber } from '../../libs/utils/convert.util';
import { CO2E_FARM_KG_PER_KG, IMPORT_TRANSIT_DAYS } from './lot.constants';

export const lotInclude = {
  product: true,
  farm: true,
  warehouse: true,
} satisfies Prisma.LotInclude;

type LotRow = Prisma.LotGetPayload<{ include: typeof lotInclude }>;

const HOUR = 3_600_000;

export function toLotSummary(lot: LotRow): LotSummary {
  return {
    id: lot.id,
    lotCode: lot.lotCode,
    lotStatus: lot.lotStatus,
    productName: toLocalizedText(lot.product.productName),
    productType: lot.product.productType,
    farmName: toLocalizedText(lot.farm.farmName),
    lotMilkedAt: lot.lotMilkedAt.toISOString(),
    lotBacteriaGrade: lot.lotBacteriaGrade,
    lotSomaticGrade: lot.lotSomaticGrade,
  };
}

export function toLotPassport(lot: LotRow): LotPassport {
  const volume = toNumber(lot.lotVolumeTon);
  const total = toNumber(lot.lotCo2eKg);
  const farmKg = Math.round(volume * 1000 * CO2E_FARM_KG_PER_KG);
  return {
    ...toLotSummary(lot),
    lotCollectedAt: lot.lotCollectedAt.toISOString(),
    lotArrivedAt: lot.lotArrivedAt.toISOString(),
    lotUseBy: lot.lotUseBy.toISOString(),
    lotVolumeTon: volume,
    lotRemainingTon: toNumber(lot.lotRemainingTon),
    lotBacteriaCount: lot.lotBacteriaCount,
    lotSomaticCount: lot.lotSomaticCount,
    lotFatPct: toNumber(lot.lotFatPct),
    lotProteinPct: toNumber(lot.lotProteinPct),
    lotAntibiotic: lot.lotAntibiotic,
    lotTempLog: lot.lotTempLog as unknown as LotTempPoint[],
    lotIsSurplus: lot.lotIsSurplus,
    farm: {
      id: lot.farm.id,
      farmName: toLocalizedText(lot.farm.farmName),
      farmAddress: lot.farm.farmAddress,
      farmLat: lot.farm.farmLat,
      farmLng: lot.farm.farmLng,
      farmCertifications: lot.farm.farmCertifications,
    },
    warehouse: {
      id: lot.warehouse.id,
      warehouseName: toLocalizedText(lot.warehouse.warehouseName),
      warehouseCode: lot.warehouse.warehouseCode,
      warehouseLat: lot.warehouse.warehouseLat,
      warehouseLng: lot.warehouse.warehouseLng,
    },
    farmToWarehouseHours:
      Math.round(((lot.lotArrivedAt.getTime() - lot.lotMilkedAt.getTime()) / HOUR) * 10) / 10,
    importTransitDays: IMPORT_TRANSIT_DAYS,
    co2e: {
      totalKg: Math.round(total),
      farmKg,
      transportKg: Math.max(0, Math.round(total - farmKg)),
      // 1 t of milk ≈ 970 L
      perLiterG: Math.round((total * 1000) / (volume * 970)),
    },
  };
}

export function toSurplusLot(lot: LotRow, now = new Date()): SurplusLot {
  const price = surplusPrice(lot.lotBasePricePerTon, lot.lotMilkedAt, lot.lotUseBy, now);
  return {
    id: lot.id,
    lotCode: lot.lotCode,
    productName: toLocalizedText(lot.product.productName),
    productType: lot.product.productType,
    farmName: toLocalizedText(lot.farm.farmName),
    warehouse: {
      id: lot.warehouse.id,
      warehouseName: toLocalizedText(lot.warehouse.warehouseName),
    },
    lotMilkedAt: lot.lotMilkedAt.toISOString(),
    lotUseBy: lot.lotUseBy.toISOString(),
    lotRemainingTon: toNumber(lot.lotRemainingTon),
    lotVolumeTon: toNumber(lot.lotVolumeTon),
    lotBacteriaGrade: lot.lotBacteriaGrade,
    lotSomaticGrade: lot.lotSomaticGrade,
    lotFatPct: toNumber(lot.lotFatPct),
    basePricePerTon: lot.lotBasePricePerTon,
    pricePerTon: price.pricePerTon,
    discountPct: price.discountPct,
    hoursLeft: price.hoursLeft,
    nextDropAt: price.nextDropAt,
  };
}
