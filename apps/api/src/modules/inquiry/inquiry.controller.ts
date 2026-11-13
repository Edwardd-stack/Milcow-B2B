import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { CurrentMember } from '../../common/decorators/current-member.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthMember } from '../../libs/types/auth.type';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { InquiryListQueryDto } from './dto/inquiry-list-query.dto';
import { INQUIRY_RATE_LIMIT } from './inquiry.constants';
import { InquiryService } from './inquiry.service';

@ApiTags('Inquiries')
@Controller('inquiries')
export class InquiryController {
  constructor(private readonly inquiryService: InquiryService) {}

  @Post()
  @Public() // the contact form works without an account
  @UseGuards(ThrottlerGuard) // …so limit it per IP against spam
  @Throttle({ default: INQUIRY_RATE_LIMIT })
  @ApiOperation({ summary: 'Contact form: leave a question for Milcow staff' })
  create(@Body() input: CreateInquiryDto) {
    return this.inquiryService.create(input);
  }

  @Get()
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin inbox (NEW / ANSWERED)' })
  findAll(@CurrentMember() member: AuthMember, @Query() query: InquiryListQueryDto) {
    return this.inquiryService.findAll(member, query);
  }

  @Patch(':id/answered')
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark as answered (the reply itself is sent by e-mail)' })
  markAnswered(@CurrentMember() member: AuthMember, @Param('id', ParseUUIDPipe) id: string) {
    return this.inquiryService.markAnswered(member, id);
  }
}
