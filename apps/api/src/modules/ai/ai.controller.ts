import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ThinkingLevel } from '@google/genai';
import { Roles } from '../../common/decorators/roles.decorator';
import { GeminiService } from './gemini.service';

@ApiTags('AI')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly gemini: GeminiService) {}

  @Get('status')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Check both Gemini models with a tiny real request' })
  async status() {
    // allSettled: one failing model must not hide the result of the other
    const [chat, embedding] = await Promise.allSettled([
      measure(() =>
        this.gemini.generateText('Reply with exactly one word: OK', {
          thinkingLevel: ThinkingLevel.MINIMAL,
        }),
      ),
      measure(() => this.gemini.embedQuery('원유 가격').then((v) => v.length)),
    ]);
    return {
      chat: { model: this.gemini.chatModel, ...settled(chat) },
      embedding: { model: this.gemini.embeddingModel, ...settled(embedding) },
    };
  }
}

async function measure<T>(fn: () => Promise<T>) {
  const startedAt = Date.now();
  const result = await fn();
  return { result, latencyMs: Date.now() - startedAt };
}

function settled<T>(outcome: PromiseSettledResult<T>) {
  return outcome.status === 'fulfilled'
    ? { ok: true, ...outcome.value }
    : { ok: false, error: outcome.reason instanceof Error ? outcome.reason.message : 'failed' };
}
