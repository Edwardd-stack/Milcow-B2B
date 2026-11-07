import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './libs/config/env.validation';
import { PrismaModule } from './libs/prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';

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
    HealthModule,
  ],
})
export class AppModule {}
