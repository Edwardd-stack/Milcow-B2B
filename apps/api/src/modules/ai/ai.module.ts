import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { GeminiService } from './gemini.service';
import { KnowledgeController } from './knowledge/knowledge.controller';
import { KnowledgeService } from './knowledge/knowledge.service';

@Module({
  controllers: [AiController, KnowledgeController],
  providers: [GeminiService, KnowledgeService],
  exports: [GeminiService, KnowledgeService],
})
export class AiModule {}
