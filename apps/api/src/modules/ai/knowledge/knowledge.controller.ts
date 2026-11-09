import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { KnowledgeIngestResult } from '@milcow/shared';
import { Roles } from '../../../common/decorators/roles.decorator';
import { KnowledgeService } from './knowledge.service';

@ApiTags('AI')
@ApiBearerAuth()
@Controller('ai/knowledge')
export class KnowledgeController {
  constructor(private readonly knowledge: KnowledgeService) {}

  @Post('ingest')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rebuild the RAG knowledge base (markdown docs + live catalog)' })
  ingest(): Promise<KnowledgeIngestResult> {
    return this.knowledge.ingest();
  }
}
