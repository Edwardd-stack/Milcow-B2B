/** Must match the database column: knowledge_chunks.chunk_embedding vector(768) */
export const EMBEDDING_DIMENSIONS = 768;

/** How many embedding requests run in parallel during ingest */
export const EMBEDDING_CONCURRENCY = 5;

/** Per-request timeout for Gemini calls */
export const GEMINI_TIMEOUT_MS = 30_000;
