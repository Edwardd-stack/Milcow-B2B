import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, ThinkingLevel, type Schema } from '@google/genai';
import { EMBEDDING_BATCH_SIZE, EMBEDDING_DIMENSIONS, GEMINI_TIMEOUT_MS } from './ai.constants';

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
    const [vector] = await this.embed([`task: search result | query: ${question}`]);
    if (!vector) throw new ServiceUnavailableException('AI embedding failed');
    return vector;
  }

  /** Embeddings for knowledge-base chunks (RAG "ingest" step), batched */
  async embedDocuments(documents: DocumentToEmbed[]): Promise<number[][]> {
    const vectors: number[][] = [];
    for (let i = 0; i < documents.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = documents.slice(i, i + EMBEDDING_BATCH_SIZE);
      vectors.push(...(await this.embed(batch.map((d) => `title: ${d.title} | text: ${d.text}`))));
    }
    return vectors;
  }

  private async embed(texts: string[]): Promise<number[][]> {
    const response = await this.call('embed', () =>
      this.ai.models.embedContent({
        model: this.embeddingModel,
        contents: texts,
        config: { outputDimensionality: EMBEDDING_DIMENSIONS },
      }),
    );
    const vectors = (response.embeddings ?? []).map((e) => e.values ?? []);
    if (vectors.length !== texts.length || vectors.some((v) => v.length !== EMBEDDING_DIMENSIONS)) {
      throw new ServiceUnavailableException('AI embedding returned an unexpected shape');
    }
    return vectors;
  }

  /** Turns any SDK/network error into a clean 503 and logs the real reason */
  private async call<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      this.logger.error(
        `Gemini ${operation} failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new ServiceUnavailableException('AI service is temporarily unavailable');
    }
  }
}
