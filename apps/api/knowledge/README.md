# Knowledge base (RAG)

Static documents the AI chatbot answers from. One folder per language, same file names in each.

- Split into chunks by `## ` headings — keep each section about one topic.
- Products, add-on services and warehouses are NOT written here: they are read from the database on every ingest, so prices are always current.
- After editing, run `POST /api/v1/ai/knowledge/ingest` (ADMIN) to re-embed.
