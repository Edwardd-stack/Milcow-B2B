import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../libs/prisma/prisma.service';
import { koreaToday } from '../../libs/utils/date.util';
import { expireOldLots, generateLotsForDay } from './lot-generator';
import { LotService } from './lot.service';

/** Hourly while the server is awake (06:20–23:20): lots that arrived since the last run + expire old ones. */
@Injectable()
export class LotScheduler {
  private readonly logger = new Logger(LotScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly lotService: LotService,
  ) {}

  @Cron('20 6-23 * * *', { name: 'milk-lots', timeZone: 'Asia/Seoul' })
  async createTodaysLots() {
    const created = await generateLotsForDay(this.prisma, koreaToday());
    const expired = await expireOldLots(this.prisma);
    this.logger.log(`Milk lots: ${created} new, ${expired} expired`);
  }

  /** Unpaid surplus reservations older than 30 minutes give their tons back (also done lazily on read) */
  @Cron('*/10 * * * *', { name: 'surplus-holds' })
  async releaseHolds() {
    await this.lotService.releaseExpiredHolds();
  }
}
