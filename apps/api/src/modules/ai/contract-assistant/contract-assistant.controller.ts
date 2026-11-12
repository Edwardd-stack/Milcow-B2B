import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { ContractDraftResponse } from '@milcow/shared';
import { CurrentMember } from '../../../common/decorators/current-member.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import type { AuthMember } from '../../../libs/types/auth.type';
import { CONTRACT_ASSISTANT_RATE_LIMIT } from './contract-assistant.constants';
import { ContractAssistantService } from './contract-assistant.service';
import { ContractDraftRequestDto } from './dto/contract-draft-request.dto';

@ApiTags('AI')
@ApiBearerAuth()
@Controller('ai/contract-draft')
export class ContractAssistantController {
  constructor(private readonly assistant: ContractAssistantService) {}

  @Post()
  @Roles('BUYER')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: CONTRACT_ASSISTANT_RATE_LIMIT })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Turn a free-text request into a contract draft (nothing is saved; send the draft to POST /contracts)',
  })
  draft(
    @CurrentMember() member: AuthMember,
    @Body() dto: ContractDraftRequestDto,
  ): Promise<ContractDraftResponse> {
    return this.assistant.draft(dto, member.id);
  }
}
