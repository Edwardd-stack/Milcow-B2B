import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/** @Global — import once in AppModule, use PrismaService in every module. */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
