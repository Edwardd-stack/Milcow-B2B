import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../libs/prisma/prisma.service';
import { ensurePickupSlots } from './pickup-slots';

/** Background job: every night, open pickup slots for the next 2 weeks (the window keeps moving). */
@Injectable()
export class PickupScheduler {
  private readonly logger = new Logger(PickupScheduler.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('30 0 * * *', { name: 'pickup-slots', timeZone: 'Asia/Seoul' })
  async openUpcomingSlots() {
    const created = await ensurePickupSlots(this.prisma);
    this.logger.log(`Pickup slots: ${created} new`);
  }
}
