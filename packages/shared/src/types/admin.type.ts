import type {
  ContractStatus,
  DeliveryType,
  OrderEventType,
  OrderStatus,
  PaymentStatus,
  ProductGrade,
  ProductStatus,
  ProductType,
} from '../enums';
import type { Locale, LocalizedText } from './common.type';

// ─────────────────────────── Demo roles ───────────────────────────

/** POST /demo/login body — which demo account to enter */
export type DemoRole = 'BUYER' | 'ADMIN' | 'STAFF';

/** GET /auth/socket-token — short-lived token for the realtime socket */
export interface SocketTokenResponse {
  token: string; // JWT, valid ~60 s (only for the handshake)
  url: string; // API origin the browser connects to directly
}

// ─────────────────────────── Dashboard ───────────────────────────

/** GET /admin/stats */
export interface AdminStats {
  today: { orders: number; revenue: number }; // revenue = paid today (KRW)
  month: { revenue: number; orders: number }; // DONE payments this month (refunds excluded)
  daily: { date: string; revenue: number; orders: number }[]; // last 14 days, oldest first
  contractsInReview: number;
  newInquiries: number;
  lowStock: {
    productId: string;
    productName: LocalizedText;
    warehouseName: LocalizedText;
    ton: number;
  }[];
  recentOrders: AdminOrderRow[];
}

// ─────────────────────────── Orders ───────────────────────────

/** Who placed the order (admin views; masked in a demo session) */
export interface OrderCustomer {
  id: string;
  companyName: string | null;
  nick: string;
  email: string;
  phone: string | null;
  isDemo: boolean;
}

/** One line of the order history */
export interface OrderEventInfo {
  id: string;
  eventType: OrderEventType;
  eventFrom: string | null;
  eventTo: string | null;
  eventNote: string | null;
  actor: { nick: string; memberType: string } | null; // null = system (cron, payment)
  createdAt: string;
}

/** Latest payment attempt of an order */
export interface OrderPaymentSummary {
  paymentStatus: PaymentStatus;
  paymentMethod: string | null;
  paymentAmount: number;
  paymentApprovedAt: string | null;
  isDemo: boolean; // demo payment — never sent to Toss
}

/** Admin order table row */
export interface AdminOrderRow {
  id: string;
  orderStatus: OrderStatus;
  orderDeliveryType: DeliveryType;
  orderTotal: number;
  warehouseName: LocalizedText;
  customer: OrderCustomer;
  itemsLabel: LocalizedText; // "A2 원유 외 1건"
  totalTon: number;
  createdAt: string;
}

/** PATCH /orders/:id/cancel body */
export interface CancelOrderInput {
  reason?: string;
}

// ─────────────────────────── Contracts ───────────────────────────

/** PATCH /contracts/:id/reject body */
export interface RejectContractInput {
  reason: string;
}

// ─────────────────────────── Products ───────────────────────────

/** GET /admin/products — also PAUSED products, with stock per warehouse */
export interface ProductAdminInfo {
  id: string;
  productSku: string | null;
  productType: ProductType;
  productGrade: ProductGrade;
  productStatus: ProductStatus;
  productName: LocalizedText;
  productDesc: LocalizedText | null;
  productFatPct: number | null;
  productProteinPct: number | null;
  productPricePerTon: number;
  productMinOrderTon: number;
  stock: { warehouseId: string; warehouseName: LocalizedText; inventoryTon: number }[];
  totalStockTon: number;
  updatedAt: string;
}

/** POST /admin/products, PATCH /admin/products/:id */
export interface ProductAdminInput {
  productType: ProductType;
  productGrade: ProductGrade;
  productStatus: ProductStatus;
  productName: LocalizedText;
  productDesc?: LocalizedText | null;
  productFatPct?: number | null;
  productProteinPct?: number | null;
  productPricePerTon: number;
  productMinOrderTon: number;
  stock: { warehouseId: string; inventoryTon: number }[];
}

// ─────────────────────────── Ops copilot ───────────────────────────

export const CopilotTool = {
  SALES_SUMMARY: 'salesSummary',
  TOP_CUSTOMERS: 'topCustomers',
  LOW_STOCK: 'lowStock',
  CONTRACT_PIPELINE: 'contractPipeline',
} as const;
export type CopilotTool = (typeof CopilotTool)[keyof typeof CopilotTool];

/** POST /admin/copilot body */
export interface CopilotRequest {
  question: string;
  locale: Locale;
}

/** A small result table: column keys + rows of plain values */
export interface CopilotTable {
  columns: string[];
  rows: (string | number | null)[][];
}

/** POST /admin/copilot response */
export interface CopilotResponse {
  answer: string;
  tool: CopilotTool | null; // null → the question did not fit any tool
  params: Record<string, unknown> | null;
  table: CopilotTable | null;
}

/** Contract pipeline counts (copilot + dashboard) */
export type ContractPipeline = Record<ContractStatus, number>;
