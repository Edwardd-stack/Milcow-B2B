-- Manual addition: enable pgvector BEFORE creating the vector(768) column.
-- Needed for Prisma's shadow database and for any fresh database (CI, production).
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "ai_log_type" AS ENUM ('CHAT', 'CONTRACT');

-- CreateTable
CREATE TABLE "knowledge_chunks" (
    "id" UUID NOT NULL,
    "chunk_source" TEXT NOT NULL,
    "chunk_lang" "lang" NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "chunk_text" TEXT NOT NULL,
    "chunk_embedding" vector(768),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_logs" (
    "id" UUID NOT NULL,
    "log_type" "ai_log_type" NOT NULL,
    "log_model" TEXT,
    "log_input" TEXT NOT NULL,
    "log_output" TEXT,
    "log_error" TEXT,
    "log_latency_ms" INTEGER,
    "member_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "knowledge_chunks_chunk_lang_idx" ON "knowledge_chunks"("chunk_lang");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_chunks_chunk_source_chunk_lang_chunk_index_key" ON "knowledge_chunks"("chunk_source", "chunk_lang", "chunk_index");

-- CreateIndex
CREATE INDEX "ai_logs_log_type_created_at_idx" ON "ai_logs"("log_type", "created_at");

-- CreateIndex
CREATE INDEX "ai_logs_member_id_idx" ON "ai_logs"("member_id");

-- AddForeignKey
ALTER TABLE "ai_logs" ADD CONSTRAINT "ai_logs_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
