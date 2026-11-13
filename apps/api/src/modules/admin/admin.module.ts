import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { OrderModule } from '../order/order.module';
import { AdminController } from './admin.controller';
import { AdminProductService } from './admin-product.service';
import { AnalyticsService } from './analytics.service';
import { CopilotService } from './copilot.service';

@Module({
  imports: [OrderModule, AiModule],
  controllers: [AdminController],
  providers: [AnalyticsService, AdminProductService, CopilotService],
})
export class AdminModule {}
