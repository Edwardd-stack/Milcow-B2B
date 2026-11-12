import { Module } from '@nestjs/common';
import { OrderModule } from '../order/order.module';
import { ContractController } from './contract.controller';
import { ContractScheduler } from './contract.scheduler';
import { ContractService } from './contract.service';
import { ContractPdfService } from './pdf/contract-pdf.service';

@Module({
  imports: [OrderModule], // uses OrderService.placeOrder for monthly orders
  controllers: [ContractController],
  providers: [ContractService, ContractScheduler, ContractPdfService],
})
export class ContractModule {}
