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
