import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ContractService } from './contract.service';

/** Background job: every day at 06:10 Korea time (the free server sleeps at night), create today's contract orders. */
@Injectable()
export class ContractScheduler {
  constructor(private readonly contractService: ContractService) {}

  @Cron('10 6 * * *', { name: 'contract-monthly-orders', timeZone: 'Asia/Seoul' })
  async createTodaysContractOrders() {
    await this.contractService.runMonthlyOrders();
  }
}
