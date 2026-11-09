import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ContractService } from './contract.service';

/** Background job: every day at 01:00 Korea time, create today's contract orders. */
@Injectable()
export class ContractScheduler {
  constructor(private readonly contractService: ContractService) {}

  @Cron('0 1 * * *', { name: 'contract-monthly-orders', timeZone: 'Asia/Seoul' })
  async createTodaysContractOrders() {
    await this.contractService.runMonthlyOrders();
  }
}
