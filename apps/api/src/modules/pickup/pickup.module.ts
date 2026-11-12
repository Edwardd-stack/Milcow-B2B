import { Module } from '@nestjs/common';
import { PickupController } from './pickup.controller';
import { PickupScheduler } from './pickup.scheduler';
import { PickupService } from './pickup.service';

@Module({
  controllers: [PickupController],
  providers: [PickupService, PickupScheduler],
  exports: [PickupService],
})
export class PickupModule {}
