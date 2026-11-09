import type { Lang } from '../enums/common.enum';

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
  latencyMs: number;
}
