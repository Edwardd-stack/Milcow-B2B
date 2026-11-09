/** Must match the database column: knowledge_chunks.chunk_embedding vector(768) */
export const EMBEDDING_DIMENSIONS = 768;

/** Max texts per embedding request */
export const EMBEDDING_BATCH_SIZE = 50;

/** Per-request timeout for Gemini calls */
export const GEMINI_TIMEOUT_MS = 30_000;
