import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../libs/prisma/prisma.service';
import { koreaToday } from '../../libs/utils/date.util';
import { expireOldLots, generateLotsForDay } from './lot-generator';

/** Every morning (server is awake from 06:00): today's milk lots + close the expired ones. */
@Injectable()
export class LotScheduler {
  private readonly logger = new Logger(LotScheduler.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('20 6 * * *', { name: 'milk-lots', timeZone: 'Asia/Seoul' })
  async createTodaysLots() {
    const created = await generateLotsForDay(this.prisma, koreaToday());
    const expired = await expireOldLots(this.prisma);
    this.logger.log(`Milk lots: ${created} new, ${expired} expired`);
  }
}
