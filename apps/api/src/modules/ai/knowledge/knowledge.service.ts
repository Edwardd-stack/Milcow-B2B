import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import {
  LOCALES,
  type KnowledgeIngestResult,
  type KnowledgeSourceSummary,
  type Locale,
} from '@milcow/shared';
import { PrismaService } from '../../../libs/prisma/prisma.service';
import { GeminiService } from '../gemini.service';
import { productChunk, servicePlanChunk, warehouseChunk } from './catalog-documents';
import { chunkMarkdown } from './chunker.util';
import { CatalogSource, KNOWLEDGE_DIR, LOCALE_TO_LANG } from './knowledge.constants';

/** One document ready to be embedded: where it came from + its chunks */
interface KnowledgeDocument {
  source: string;
  locale: Locale;
  title: string;
  chunks: string[];
}

/**
 * RAG "ingest" step: documents → chunks → embeddings → knowledge_chunks table.
 *
 * Sources:
 *  - static markdown in apps/api/knowledge/<locale>/*.md (rules, how-tos)
 *  - live catalog from the DB (products, add-on services, warehouses) — so prices are never stale
 *
 * Re-running is safe: each (source, lang) is replaced as a whole, never duplicated.
 */
@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
  ) {}

  async ingest(): Promise<KnowledgeIngestResult> {
    const startedAt = Date.now();
    const documents = [
      ...(await this.loadMarkdownDocuments()),
      ...(await this.loadCatalogDocuments()),
    ];

    // 1) Network first, OUTSIDE the transaction: never hold DB locks while waiting for an API
    const flat = documents.flatMap((doc) => doc.chunks.map((text) => ({ title: doc.title, text })));
    const vectors = await this.gemini.embedDocuments(flat);

    // 2) Replace everything in one transaction: a failed ingest leaves the old knowledge intact
    let cursor = 0;
    await this.prisma.$transaction(async (tx) => {
      for (const doc of documents) {
        const lang = LOCALE_TO_LANG[doc.locale];
        await tx.knowledgeChunk.deleteMany({ where: { chunkSource: doc.source, chunkLang: lang } });

        const created = await tx.knowledgeChunk.createManyAndReturn({
          data: doc.chunks.map((chunkText, chunkIndex) => ({
            chunkSource: doc.source,
            chunkLang: lang,
            chunkIndex,
            chunkText,
          })),
          select: { id: true },
        });

        // Prisma cannot write `vector` columns → one raw UPDATE for the whole document.
        // Vectors are sent as text '[0.1,0.2,...]' and cast to ::vector by PostgreSQL.
        const ids = created.map((c) => c.id);
        const embeddings = doc.chunks.map(() => JSON.stringify(vectors[cursor++]));
        await tx.$executeRaw`
          UPDATE knowledge_chunks AS k
          SET chunk_embedding = v.embedding::vector
          FROM unnest(${ids}::uuid[], ${embeddings}::text[]) AS v(id, embedding)
          WHERE k.id = v.id`;
      }
    });

    const sources: KnowledgeSourceSummary[] = documents.map((doc) => ({
      source: doc.source,
      lang: LOCALE_TO_LANG[doc.locale],
      chunks: doc.chunks.length,
    }));
    const result = { sources, totalChunks: flat.length, latencyMs: Date.now() - startedAt };
    this.logger.log(`Knowledge ingested: ${result.totalChunks} chunks in ${result.latencyMs}ms`);
    return result;
  }

  /** apps/api/knowledge/<locale>/<name>.md → source "<name>" */
  private async loadMarkdownDocuments(): Promise<KnowledgeDocument[]> {
    const documents: KnowledgeDocument[] = [];
    for (const locale of LOCALES) {
      const dir = join(process.cwd(), KNOWLEDGE_DIR, locale);
      const files = (await readdir(dir)).filter((f) => f.endsWith('.md')).sort();
      for (const file of files) {
        const markdown = await readFile(join(dir, file), 'utf8');
        const title = markdown.match(/^# (.+)$/m)?.[1]?.trim() ?? file;
        documents.push({
          source: file.replace(/\.md$/, ''),
          locale,
          title,
          chunks: chunkMarkdown(markdown),
        });
      }
    }
    return documents;
  }

  /** Live rows from the DB, one chunk per row, in every locale */
  private async loadCatalogDocuments(): Promise<KnowledgeDocument[]> {
    const [products, servicePlans, warehouses] = await Promise.all([
      this.prisma.product.findMany({
        where: { productStatus: 'ACTIVE' },
        include: { farm: true },
        orderBy: { productType: 'asc' },
      }),
      this.prisma.servicePlan.findMany({
        where: { serviceStatus: 'ACTIVE' },
        orderBy: { servicePrice: 'asc' },
      }),
      this.prisma.warehouse.findMany({ orderBy: { warehouseAddress: 'asc' } }),
    ]);

    return LOCALES.flatMap((locale) => [
      {
        source: CatalogSource.PRODUCTS,
        locale,
        title: 'Milcow products',
        chunks: products.map((p) => productChunk(p, locale)),
      },
      {
        source: CatalogSource.SERVICE_PLANS,
        locale,
        title: 'Milcow contract add-on services',
        chunks: servicePlans.map((s) => servicePlanChunk(s, locale)),
      },
      {
        source: CatalogSource.WAREHOUSES,
        locale,
        title: 'Milcow warehouses',
        chunks: warehouses.map((w) => warehouseChunk(w, locale)),
      },
    ]);
  }
}
