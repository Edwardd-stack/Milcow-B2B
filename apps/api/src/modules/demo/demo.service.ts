import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { DemoRole } from '@milcow/shared';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../libs/prisma/prisma.service';
import { AuthService, type AuthResult } from '../auth/auth.service';
import { resetDemoInquiries } from './demo-inquiries';
import { buildDemoScenario } from './demo-scenario';
import { DEMO_ACCOUNTS, DEMO_BUYER_EMAIL, DEMO_RESET_CRON } from './demo.constants';

/**
 * "Try the demo": log in as the demo buyer without a password,
 * and rebuild that buyer's data every night. Turn off with DEMO_ENABLED=false.
 */
@Injectable()
export class DemoService {
  private readonly logger = new Logger(DemoService.name);
  private readonly enabled: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    config: ConfigService,
  ) {
    this.enabled = config.get<string>('DEMO_ENABLED') !== 'false';
  }

  /**
   * Only the seeded demo accounts (memberIsDemo) — a real admin can never be entered this way.
   * Their JWT carries demo=true: they see masked contact data and may change only demo records.
   */
  async login(role: DemoRole): Promise<AuthResult> {
    const member = this.enabled
      ? await this.prisma.member.findUnique({ where: { memberEmail: DEMO_ACCOUNTS[role] } })
      : null;
    if (
      !member ||
      !member.memberIsDemo ||
      member.memberType !== role ||
      member.memberStatus !== 'ACTIVE'
    ) {
      throw new NotFoundException('Demo is not available');
    }
    return this.authService.buildAuthResponse(member);
  }

  @Cron(DEMO_RESET_CRON, { name: 'demo-reset', timeZone: 'Asia/Seoul' })
  async resetNightly() {
    if (!this.enabled) return;
    try {
      const buyer = await this.findDemoBuyer();
      const orders = await buildDemoScenario(this.prisma, buyer.id);
      const inquiries = await resetDemoInquiries(this.prisma);
      this.logger.log(`Demo data rebuilt: ${orders} orders, ${inquiries} inquiries`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error(`Demo reset failed: ${reason}`);
    }
  }

  private async findDemoBuyer() {
    const buyer = this.enabled
      ? await this.prisma.member.findUnique({ where: { memberEmail: DEMO_BUYER_EMAIL } })
      : null;
    if (!buyer || buyer.memberType !== 'BUYER' || buyer.memberStatus !== 'ACTIVE') {
      throw new NotFoundException('Demo is not available');
    }
    return buyer;
  }
}
