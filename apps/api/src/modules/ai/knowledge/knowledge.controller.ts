import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { KnowledgeIngestResult } from '@milcow/shared';
import { CurrentMember } from '../../../common/decorators/current-member.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { assertDemoCanModify } from '../../../common/policies/demo.policy';
import type { AuthMember } from '../../../libs/types/auth.type';
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
  ingest(@CurrentMember() member: AuthMember): Promise<KnowledgeIngestResult> {
    assertDemoCanModify(member, false); // costs AI quota, changes what the chatbot says
    return this.knowledge.ingest();
  }
}
