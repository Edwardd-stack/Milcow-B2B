import type { DeliveryType, Lang } from '../enums/common.enum';

/** One knowledge-base document after ingest */
export interface KnowledgeSourceSummary {
  source: string; // e.g. "platform-guide", "products"
  lang: Lang;
  chunks: number;
}

/** POST /ai/knowledge/ingest */
export interface KnowledgeIngestResult {
  sources: KnowledgeSourceSummary[];
  totalChunks: number;
  /** Chunks sent to the embedding API (new or changed text) */
  embedded: number;
  /** Chunks whose text did not change — old vector kept, no API call */
  reused: number;
  latencyMs: number;
}

/** One earlier turn of the chat, sent back by the client so the bot remembers context */
export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

/** A knowledge chunk the answer was based on */
export interface ChatSource {
  source: string;
  chunkIndex: number;
  similarity: number; // 0..1, higher = closer in meaning
}

/** POST /ai/chat */
export interface ChatResponse {
  answer: string;
  /** false → nothing relevant was found and a standard "please contact us" answer was returned */
  grounded: boolean;
  sources: ChatSource[];
}

/** Fields the buyer did not mention — the UI asks for them */
export type ContractDraftField =
  'product' | 'warehouse' | 'monthlyTon' | 'startDate' | 'months' | 'deliveryType' | 'address';

/** Same shape as the POST /contracts body, but every field may still be empty */
export interface ContractDraftInput {
  productId: string | null;
  warehouseId: string | null;
  contractStart: string | null; // YYYY-MM-DD
  contractEnd: string | null;
  contractMonthlyTon: number | null;
  contractDeliveryType: DeliveryType | null;
  contractAddress: string | null;
  servicePlanIds: string[];
}

/** Calculated by the server from DB prices — never by the AI */
export interface ContractDraftPricing {
  pricePerTon: number;
  monthlyProductTotal: number;
  monthlyServiceFee: number;
  monthlyTotal: number;
  deliveries: number;
  contractTotal: number;
}

export interface ContractDraftIssue {
  code: 'BELOW_MIN_ORDER' | 'TOO_MANY_MONTHS' | 'START_NOT_IN_FUTURE' | 'UNKNOWN_REFERENCE';
  message: string;
}

/** POST /ai/contract-draft */
export interface ContractDraftResponse {
  draft: ContractDraftInput;
  pricing: ContractDraftPricing | null;
  missing: ContractDraftField[];
  issues: ContractDraftIssue[];
  /** Short summary of what the AI understood, in the requested language */
  explanation: string;
  /** true → the draft can be sent to POST /contracts as it is */
  ready: boolean;
}
