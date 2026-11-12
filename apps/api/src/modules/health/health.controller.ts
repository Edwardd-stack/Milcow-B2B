import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  // Dependency Injection: Nest creates HealthService and passes it in
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Check that the API is running' })
  check() {
    return this.healthService.check();
  }

  /**
   * Liveness only — never touches the database. The uptime pinger calls this every few minutes
   * to keep the free server awake; /health (with SELECT 1) would keep the free database awake too.
   */
  @Public()
  @Get('live')
  @ApiOperation({ summary: 'Liveness ping (no database) — for the uptime pinger' })
  live() {
    return { status: 'ok' };
  }
}
