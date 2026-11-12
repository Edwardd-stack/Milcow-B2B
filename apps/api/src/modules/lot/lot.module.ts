import { Module } from '@nestjs/common';
import { LotScheduler } from './lot.scheduler';

@Module({
  providers: [LotScheduler],
})
export class LotModule {}
