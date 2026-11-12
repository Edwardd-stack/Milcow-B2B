import type { ContractStatus, DeliveryType, ServiceStatus, ServiceType } from '../enums';
import type { LocalizedText } from './common.type';

/** GET /service-plans */
export interface ServicePlanInfo {
  id: string;
  serviceType: ServiceType;
  serviceName: LocalizedText;
  serviceDesc: LocalizedText | null;
  servicePrice: number; // KRW per month
  serviceStatus: ServiceStatus;
}

/** POST /contracts, GET /contracts, GET /contracts/:id */
export interface ContractInfo {
  id: string;
  contractStatus: ContractStatus;
  contractStart: string; // YYYY-MM-DD — also the monthly delivery day
  contractEnd: string; // YYYY-MM-DD
  contractMonthlyTon: number;
  contractPricePerTon: number; // KRW, fixed for the whole contract
  contractDeliveryType: DeliveryType;
  contractAddress: string | null;
  contractTerms: unknown;
  contractPdfUrl: string | null;
  memberId: string;
  product: { id: string; productName: LocalizedText };
  warehouse: { id: string; warehouseName: LocalizedText };
  services: {
    servicePlanId: string;
    serviceType: ServiceType;
    serviceName: LocalizedText;
    servicePrice: number; // KRW per month, price at signing time
  }[];
  // Calculated
  contractDeliveryDates: string[]; // every monthly delivery date
  contractMonthlyTotal: number; // milk + services, KRW
  contractTotal: number; // monthly total × number of deliveries
  contractRejectReason: string | null; // set when an admin rejects it in review
  customer?: { companyName: string | null; nick: string; email: string; phone: string | null }; // admin only
  createdAt: string;
}

/** POST /contracts/monthly-orders/run */
export interface MonthlyOrderRunResult {
  date: string;
  created: { contractId: string; orderId: string }[];
  skipped: { contractId: string; reason: string }[];
}
