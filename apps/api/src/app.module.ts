import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './libs/config/env.validation';
import { PrismaModule } from './libs/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { FarmModule } from './modules/farm/farm.module';
import { HealthModule } from './modules/health/health.module';
import { MemberModule } from './modules/member/member.module';
import { OrderModule } from './modules/order/order.module';
import { ProductModule } from './modules/product/product.module';
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

    // ── Feature modules ──
    AuthModule,
    FarmModule,
    HealthModule,
    MemberModule,
    OrderModule,
    ProductModule,
    WarehouseModule,
  ],
})
export class AppModule {}
