import { Module } from '@nestjs/common';
import { TossPaymentsClient } from '../../libs/toss/toss-payments.client';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

@Module({
  controllers: [OrderController],
  providers: [OrderService, TossPaymentsClient],
  exports: [OrderService],
})
export class OrderModule {}
