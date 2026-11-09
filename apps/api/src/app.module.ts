import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { validateEnv } from './libs/config/env.validation';
import { PrismaModule } from './libs/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ContractModule } from './modules/contract/contract.module';
import { FarmModule } from './modules/farm/farm.module';
import { HealthModule } from './modules/health/health.module';
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

    // WebSocket push (global)
    RealtimeModule,

    // ── Feature modules ──
    AuthModule,
    ContractModule,
    FarmModule,
    HealthModule,
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
