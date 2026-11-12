import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
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
}
