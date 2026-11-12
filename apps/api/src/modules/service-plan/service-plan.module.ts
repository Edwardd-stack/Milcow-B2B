import { Module } from '@nestjs/common';
import { ServicePlanController } from './service-plan.controller';
import { ServicePlanService } from './service-plan.service';

@Module({
  controllers: [ServicePlanController],
  providers: [ServicePlanService],
})
export class ServicePlanModule {}
