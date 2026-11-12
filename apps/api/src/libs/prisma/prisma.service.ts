import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

/**
 * The database connection, available to every service via DI:
 *   constructor(private readonly prisma: PrismaService) {}
 *   this.prisma.product.findMany()
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: ConfigService) {
    // Prisma 7: talks to PostgreSQL through the `pg` driver adapter
    const adapter = new PrismaPg({ connectionString: config.getOrThrow<string>('DATABASE_URL') });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect(); // fail fast if the database is not reachable
  }

  async onModuleDestroy() {
    await this.$disconnect(); // close connections on shutdown
  }
}
