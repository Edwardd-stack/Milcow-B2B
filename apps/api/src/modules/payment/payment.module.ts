import { Module } from '@nestjs/common';
import { TossPaymentsClient } from '../../libs/toss/toss-payments.client';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, TossPaymentsClient],
})
export class PaymentModule {}
