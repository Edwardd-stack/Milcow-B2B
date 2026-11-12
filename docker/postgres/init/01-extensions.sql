-- Runs only once: when the database volume is created for the first time.
-- pgvector: adds the `vector` column type and distance operators (<=>, <->)
CREATE EXTENSION IF NOT EXISTS vector;
