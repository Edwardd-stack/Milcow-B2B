# Milcow

B2B dairy trading platform: bulk milk purchase by the ton, long-term supply contracts with add-on services, warehouse pickup with real-time status, farms and warehouses on Kakao Map, Toss Payments, and an AI assistant (RAG chatbot + contract drafting).

## Monorepo

| Path | Description |
| --- | --- |
| `apps/web` | Next.js — customer website (ko / en / uz) |
| `apps/admin` | Next.js — back office |
| `apps/api` | NestJS — REST API |
| `packages/shared` | Shared types and enums |
| `docs/` | ER model (`erd.dbml`) |

## Requirements

- Node.js 22+
- pnpm (via `corepack enable pnpm`)
- Docker Desktop

## Getting started

```bash
pnpm install
pnpm dev
```
