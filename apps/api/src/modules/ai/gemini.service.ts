import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, ThinkingLevel, type Schema } from '@google/genai';
import {
  EMBEDDING_CONCURRENCY,
  EMBEDDING_DIMENSIONS,
  EMBEDDING_GROUP_INTERVAL_MS,
  EMBEDDING_MAX_RETRIES,
  GEMINI_TIMEOUT_MS,
} from './ai.constants';

export interface GenerateOptions {
  systemInstruction?: string;
  temperature?: number;
  /** How long the model "thinks" before answering — more = smarter but slower */
  thinkingLevel?: ThinkingLevel;
}

export interface DocumentToEmbed {
  title: string;
  text: string;
}

/**
 * The only place that talks to Google Gemini.
 * Features (RAG chatbot, contract assistant) use these methods and never the SDK directly,
 * so changing a model or provider touches one file.
 */
@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly ai: GoogleGenAI;
  readonly chatModel: string;
  readonly embeddingModel: string;

  constructor(config: ConfigService) {
    this.ai = new GoogleGenAI({
      apiKey: config.getOrThrow<string>('GEMINI_API_KEY'),
      // Never let a slow AI call hang a request forever
      httpOptions: { timeout: GEMINI_TIMEOUT_MS },
    });
    this.chatModel = config.getOrThrow<string>('GEMINI_CHAT_MODEL');
    this.embeddingModel = config.getOrThrow<string>('GEMINI_EMBEDDING_MODEL');
  }

  /** Free-form text answer */
  async generateText(prompt: string, options: GenerateOptions = {}): Promise<string> {
    const response = await this.call('generateText', () =>
      this.ai.models.generateContent({
        model: this.chatModel,
        contents: prompt,
        config: {
          systemInstruction: options.systemInstruction,
          temperature: options.temperature ?? 0.3,
          thinkingConfig: { thinkingLevel: options.thinkingLevel ?? ThinkingLevel.LOW },
        },
      }),
    );
    return response.text?.trim() ?? '';
  }

  /**
   * Structured output: the model must answer with JSON matching `schema`.
   * The caller still validates the result — never trust model output blindly.
   */
  async generateJson<T>(prompt: string, schema: Schema, options: GenerateOptions = {}): Promise<T> {
    const response = await this.call('generateJson', () =>
      this.ai.models.generateContent({
        model: this.chatModel,
        contents: prompt,
        config: {
          systemInstruction: options.systemInstruction,
          temperature: options.temperature ?? 0.2,
          thinkingConfig: { thinkingLevel: options.thinkingLevel ?? ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      }),
    );
    try {
      return JSON.parse(response.text ?? '') as T;
    } catch {
      throw new ServiceUnavailableException('AI returned an invalid answer, please try again');
    }
  }

  /** Embedding for a user question (RAG "retrieval" step) */
  async embedQuery(question: string): Promise<number[]> {
    return this.embed(`task: search result | query: ${question}`);
  }

  /**
   * Embeddings for knowledge-base chunks (RAG "ingest" step).
   * gemini-embedding-2 merges several inputs into ONE vector, so every text is its own request.
   * Small parallel groups, spaced out to stay under the free-tier per-minute limit,
   * and a 429 is retried after the delay Google asks for (ingest is a background job — it can wait).
   */
  async embedDocuments(documents: DocumentToEmbed[]): Promise<number[][]> {
    const texts = documents.map((d) => `title: ${d.title} | text: ${d.text}`);
    const vectors: number[][] = [];
    for (let i = 0; i < texts.length; i += EMBEDDING_CONCURRENCY) {
      const groupStartedAt = Date.now();
      const group = texts.slice(i, i + EMBEDDING_CONCURRENCY);
      vectors.push(
        ...(await Promise.all(group.map((text) => this.embed(text, EMBEDDING_MAX_RETRIES)))),
      );
      const isLast = i + EMBEDDING_CONCURRENCY >= texts.length;
      if (!isLast) await sleep(EMBEDDING_GROUP_INTERVAL_MS - (Date.now() - groupStartedAt));
    }
    return vectors;
  }

  /** `retries` > 0 only for ingest; a chat question fails fast instead of making the user wait */
  private async embed(text: string, retries = 0): Promise<number[]> {
    for (let attempt = 0; ; attempt++) {
      try {
        const response = await this.ai.models.embedContent({
          model: this.embeddingModel,
          contents: text,
          config: { outputDimensionality: EMBEDDING_DIMENSIONS },
        });
        const vector = response.embeddings?.[0]?.values ?? [];
        if (vector.length !== EMBEDDING_DIMENSIONS) {
          throw new ServiceUnavailableException('AI embedding returned an unexpected shape');
        }
        return vector;
      } catch (error) {
        const waitMs = quotaRetryDelayMs(error);
        if (waitMs !== null && attempt < retries) {
          this.logger.warn(`Embedding quota hit — retrying in ${Math.ceil(waitMs / 1000)}s`);
          await sleep(waitMs);
          continue;
        }
        throw this.toUnavailable('embed', error);
      }
    }
  }

  /** Turns any SDK/network error into a clean 503 and logs the real reason */
  private async call<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      throw this.toUnavailable(operation, error);
    }
  }

  private toUnavailable(operation: string, error: unknown): ServiceUnavailableException {
    if (error instanceof ServiceUnavailableException) return error;
    this.logger.error(
      `Gemini ${operation} failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    return new ServiceUnavailableException('AI service is temporarily unavailable');
  }
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, Math.max(0, ms)));

/**
 * 429 RESOURCE_EXHAUSTED → how long Google asks us to wait (its "retryDelay": "27s"), else null.
 * Adds 1 s of margin; falls back to 30 s when the delay is missing.
 */
function quotaRetryDelayMs(error: unknown): number | null {
  const message = error instanceof Error ? error.message : '';
  const status = (error as { status?: number } | null)?.status;
  if (status !== 429 && !message.includes('RESOURCE_EXHAUSTED')) return null;
  const seconds = /"retryDelay":"(\d+(?:\.\d+)?)s"/.exec(message)?.[1];
  return seconds ? (Number(seconds) + 1) * 1000 : 30_000;
}
