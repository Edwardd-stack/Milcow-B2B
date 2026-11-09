import type { Locale } from '@milcow/shared';
import type { Lang } from '../../../generated/prisma/client';

/** Folder with the static markdown documents (apps/api/knowledge) */
export const KNOWLEDGE_DIR = 'knowledge';

/** A chunk longer than this is split again by paragraphs */
export const MAX_CHUNK_CHARS = 1200;

/** Our locale code ↔ the DB enum used in knowledge_chunks.chunk_lang */
export const LOCALE_TO_LANG: Record<Locale, Lang> = { ko: 'KO', en: 'EN', uz: 'UZ' };

/** Sources built from the database, not from markdown files */
export const CatalogSource = {
  PRODUCTS: 'products',
  SERVICE_PLANS: 'service-plans',
  WAREHOUSES: 'warehouses',
} as const;
