import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentMember } from '../../common/decorators/current-member.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthMember } from '../../libs/types/auth.type';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { FailPaymentDto } from './dto/fail-payment.dto';
import { PreparePaymentDto } from './dto/prepare-payment.dto';
import { PaymentService } from './payment.service';

@ApiTags('Payments')
@ApiBearerAuth()
@Roles('BUYER')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('prepare')
  @ApiOperation({
    summary: '1) Create a payment for a PENDING order (amount comes from the server)',
  })
  prepare(@CurrentMember() member: AuthMember, @Body() input: PreparePaymentDto) {
    return this.paymentService.prepare(member, input.orderId);
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '2) After the Toss window: verify and approve (order → PAID)' })
  confirm(@CurrentMember() member: AuthMember, @Body() input: ConfirmPaymentDto) {
    return this.paymentService.confirm(member, input);
  }

  @Post('fail')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toss failUrl: the buyer cancelled or the card was rejected' })
  fail(@CurrentMember() member: AuthMember, @Body() input: FailPaymentDto) {
    return this.paymentService.fail(member, input);
  }
}
