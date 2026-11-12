import { Module } from '@nestjs/common';
import { AiLogService } from './ai-log.service';
import { AiController } from './ai.controller';
import { ChatController } from './chat/chat.controller';
import { ChatService } from './chat/chat.service';
import { ContractAssistantController } from './contract-assistant/contract-assistant.controller';
import { ContractAssistantService } from './contract-assistant/contract-assistant.service';
import { GeminiService } from './gemini.service';
import { KnowledgeController } from './knowledge/knowledge.controller';
import { KnowledgeService } from './knowledge/knowledge.service';

@Module({
  controllers: [AiController, KnowledgeController, ChatController, ContractAssistantController],
  providers: [GeminiService, AiLogService, KnowledgeService, ChatService, ContractAssistantService],
  exports: [GeminiService, AiLogService, KnowledgeService],
})
export class AiModule {}
