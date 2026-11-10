/** Must match the database column: knowledge_chunks.chunk_embedding vector(768) */
export const EMBEDDING_DIMENSIONS = 768;

/** How many embedding requests run in parallel during ingest */
export const EMBEDDING_CONCURRENCY = 5;

/**
 * Free tier allows 100 embedding requests per minute.
 * One group of 5 every 4 s = 75 per minute → safely under the limit.
 */
export const EMBEDDING_GROUP_INTERVAL_MS = 4_000;

/** On 429 (quota) during ingest: wait as long as Google asks, at most this many times */
export const EMBEDDING_MAX_RETRIES = 3;

/** Per-request timeout for Gemini calls */
export const GEMINI_TIMEOUT_MS = 30_000;
