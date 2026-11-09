import { Injectable } from '@nestjs/common';
import type { ChatResponse } from '@milcow/shared';
import { AiLogService } from '../ai-log.service';
import { GeminiService } from '../gemini.service';
import { KnowledgeService, type RetrievedChunk } from '../knowledge/knowledge.service';
import {
  CHAT_MIN_SIMILARITY,
  CHAT_TOP_K,
  NO_ANSWER,
  chatSystemInstruction,
} from './chat.constants';
import type { ChatRequestDto } from './dto/chat-request.dto';

/**
 * RAG chatbot: question → find relevant chunks (retrieval) → answer only from them (generation).
 */
@Injectable()
export class ChatService {
  constructor(
    private readonly knowledge: KnowledgeService,
    private readonly gemini: GeminiService,
    private readonly aiLog: AiLogService,
  ) {}

  async ask(dto: ChatRequestDto, memberId?: string): Promise<ChatResponse> {
    const startedAt = Date.now();
    const log = (output: string | undefined, error?: string) =>
      this.aiLog.record({
        type: 'CHAT',
        model: this.gemini.chatModel,
        input: dto.question,
        output,
        error,
        latencyMs: Date.now() - startedAt,
        memberId,
      });

    try {
      // 1) Retrieval — keep only chunks that are actually about the question
      const found = await this.knowledge.search(this.searchText(dto), dto.locale, CHAT_TOP_K);
      const relevant = found.filter((c) => c.similarity >= CHAT_MIN_SIMILARITY);

      // Nothing relevant → don't even call the model: cheaper and it cannot make things up
      if (relevant.length === 0) {
        const answer = NO_ANSWER[dto.locale];
        await log(answer);
        return { answer, grounded: false, sources: [] };
      }

      // 2) Generation — the model sees only our facts
      const answer = await this.gemini.generateText(this.buildPrompt(dto, relevant), {
        systemInstruction: chatSystemInstruction(dto.locale),
        temperature: 0.2,
      });
      await log(answer);

      return {
        answer,
        grounded: answer !== NO_ANSWER[dto.locale],
        sources: relevant.map((c) => ({
          source: c.source,
          chunkIndex: c.chunkIndex,
          similarity: Math.round(c.similarity * 1000) / 1000,
        })),
      };
    } catch (error) {
      await log(undefined, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /** A follow-up like "and the price?" needs the previous question to be searchable */
  private searchText(dto: ChatRequestDto): string {
    const lastUserTurn = dto.history?.filter((m) => m.role === 'user').at(-1)?.text;
    return lastUserTurn ? `${lastUserTurn}\n${dto.question}` : dto.question;
  }

  private buildPrompt(dto: ChatRequestDto, chunks: RetrievedChunk[]): string {
    const context = chunks.map((c, i) => `[${i + 1}] ${c.text}`).join('\n\n');
    const history = (dto.history ?? [])
      .map((m) => `${m.role === 'user' ? 'Customer' : 'Assistant'}: ${m.text}`)
      .join('\n');
    return [
      `<context>\n${context}\n</context>`,
      history ? `<conversation>\n${history}\n</conversation>` : '',
      `Customer question: ${dto.question}`,
    ]
      .filter(Boolean)
      .join('\n\n');
  }
}
