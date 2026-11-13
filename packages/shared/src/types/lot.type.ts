import type {
  AntibioticResult,
  BacteriaGrade,
  FarmCertification,
  LotStatus,
  ProductType,
  SomaticGrade,
  TempStage,
} from '../enums';
import type { LocalizedText } from './common.type';

export interface LotTempPoint {
  at: string; // ISO
  c: number; // °C
  stage: TempStage;
}

/** Short lot card (passport examples, order lines) */
export interface LotSummary {
  id: string;
  lotCode: string;
  lotStatus: LotStatus;
  productName: LocalizedText;
  productType: ProductType;
  farmName: LocalizedText;
  lotMilkedAt: string;
  lotBacteriaGrade: BacteriaGrade;
  lotSomaticGrade: SomaticGrade;
}

/** GET /lots/:code — 원유 품질 여권 */
export interface LotPassport extends LotSummary {
  lotCollectedAt: string;
  lotArrivedAt: string;
  lotUseBy: string;
  lotVolumeTon: number;
  lotRemainingTon: number;
  lotBacteriaCount: number;
  lotSomaticCount: number;
  lotFatPct: number;
  lotProteinPct: number;
  lotAntibiotic: AntibioticResult;
  lotTempLog: LotTempPoint[];
  lotIsSurplus: boolean;
  farm: {
    id: string;
    farmName: LocalizedText;
    farmAddress: string;
    farmLat: number;
    farmLng: number;
    farmCertifications: FarmCertification[];
  };
  warehouse: {
    id: string;
    warehouseName: LocalizedText;
    warehouseCode: string | null;
    warehouseLat: number;
    warehouseLng: number;
  };
  /** Hours from milking to arrival at the warehouse */
  farmToWarehouseHours: number;
  /** Estimate for comparison: imported UHT milk, sea freight + customs + distribution */
  importTransitDays: number;
  co2e: { totalKg: number; farmKg: number; transportKg: number; perLiterG: number };
}

/** GET /surplus — one lot on the surplus exchange, priced NOW */
export interface SurplusLot {
  id: string;
  lotCode: string;
  productName: LocalizedText;
  productType: ProductType;
  farmName: LocalizedText;
  warehouse: { id: string; warehouseName: LocalizedText };
  lotMilkedAt: string;
  lotUseBy: string;
  lotRemainingTon: number;
  lotVolumeTon: number;
  lotBacteriaGrade: BacteriaGrade;
  lotSomaticGrade: SomaticGrade;
  lotFatPct: number;
  basePricePerTon: number;
  pricePerTon: number;
  discountPct: number;
  hoursLeft: number;
  nextDropAt: string | null;
}

/** POST /surplus/:lotId/reserve */
export interface ReserveSurplusInput {
  ton: number;
}
