import { Injectable, Logger } from '@nestjs/common';
import type { AiLogType } from '../../generated/prisma/client';
import { PrismaService } from '../../libs/prisma/prisma.service';

export interface AiLogEntry {
  type: AiLogType;
  model: string;
  input: string;
  output?: string;
  error?: string;
  latencyMs: number;
  memberId?: string;
}

/** Records every AI request — what was asked, what came back, how long it took */
@Injectable()
export class AiLogService {
  private readonly logger = new Logger(AiLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Never throws: a failed log must not break the user's answer */
  async record(entry: AiLogEntry): Promise<void> {
    try {
      await this.prisma.aiLog.create({
        data: {
          logType: entry.type,
          logModel: entry.model,
          logInput: entry.input,
          logOutput: entry.output,
          logError: entry.error,
          logLatencyMs: entry.latencyMs,
          memberId: entry.memberId,
        },
      });
    } catch (error) {
      this.logger.warn(
        `AI log not saved: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
