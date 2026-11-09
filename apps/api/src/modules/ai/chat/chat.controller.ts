import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { ChatResponse } from '@milcow/shared';
import { OptionalMember } from '../../../common/decorators/optional-member.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import type { AuthMember } from '../../../libs/types/auth.type';
import { CHAT_RATE_LIMIT } from './chat.constants';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';

@ApiTags('AI')
@Controller('ai/chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post()
  @Public() // visitors can ask before signing up
  @UseGuards(ThrottlerGuard) // …but every AI call costs quota, so limit it per IP
  @Throttle({ default: CHAT_RATE_LIMIT })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ask the RAG chatbot (answers only from the Milcow knowledge base)' })
  ask(@Body() dto: ChatRequestDto, @OptionalMember() member?: AuthMember): Promise<ChatResponse> {
    return this.chat.ask(dto, member?.id);
  }
}
