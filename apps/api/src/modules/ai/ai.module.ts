import { Module } from '@nestjs/common';
import { AiLogService } from './ai-log.service';
import { AiController } from './ai.controller';
import { ChatController } from './chat/chat.controller';
import { ChatService } from './chat/chat.service';
import { GeminiService } from './gemini.service';
import { KnowledgeController } from './knowledge/knowledge.controller';
import { KnowledgeService } from './knowledge/knowledge.service';

@Module({
  controllers: [AiController, KnowledgeController, ChatController],
  providers: [GeminiService, AiLogService, KnowledgeService, ChatService],
  exports: [GeminiService, AiLogService, KnowledgeService],
})
export class AiModule {}
