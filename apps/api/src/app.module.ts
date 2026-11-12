import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { validateEnv } from './libs/config/env.validation';
import { PrismaModule } from './libs/prisma/prisma.module';
import { AdminModule } from './modules/admin/admin.module';
import { AiModule } from './modules/ai/ai.module';
import { AuthModule } from './modules/auth/auth.module';
import { ContractModule } from './modules/contract/contract.module';
import { DemoModule } from './modules/demo/demo.module';
import { FarmModule } from './modules/farm/farm.module';
import { HealthModule } from './modules/health/health.module';
import { InquiryModule } from './modules/inquiry/inquiry.module';
import { LotModule } from './modules/lot/lot.module';
import { MemberModule } from './modules/member/member.module';
import { OrderModule } from './modules/order/order.module';
import { PaymentModule } from './modules/payment/payment.module';
import { PickupModule } from './modules/pickup/pickup.module';
import { ProductModule } from './modules/product/product.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { ServicePlanModule } from './modules/service-plan/service-plan.module';
import { WarehouseModule } from './modules/warehouse/warehouse.module';

@Module({
  imports: [
    // Reads apps/api/.env, validates it, and makes ConfigService available everywhere
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),

    // Database connection (global)
    PrismaModule,

    // Background jobs (@Cron)
    ScheduleModule.forRoot(),
    // Rate limiting storage; applied only where @UseGuards(ThrottlerGuard) is used (AI chat)
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 60 }]),

    // WebSocket push (global)
    RealtimeModule,

    // ── Feature modules ──
    AdminModule,
    AiModule,
    AuthModule,
    ContractModule,
    DemoModule,
    FarmModule,
    HealthModule,
    InquiryModule,
    LotModule,
    MemberModule,
    OrderModule,
    PaymentModule,
    PickupModule,
    ProductModule,
    ServicePlanModule,
    WarehouseModule,
  ],
})
export class AppModule {}
