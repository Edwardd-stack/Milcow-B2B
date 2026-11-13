import { Module } from '@nestjs/common';
import { LotController } from './lot.controller';
import { LotScheduler } from './lot.scheduler';
import { LotService } from './lot.service';

@Module({
  controllers: [LotController],
  providers: [LotService, LotScheduler],
  exports: [LotService],
})
export class LotModule {}
