import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ServicePlanService } from './service-plan.service';

@ApiTags('Service plans')
@Public()
@Controller('service-plans')
export class ServicePlanController {
  constructor(private readonly servicePlanService: ServicePlanService) {}

  @Get()
  @ApiOperation({ summary: 'Add-on services a buyer can choose for a contract' })
  findActive() {
    return this.servicePlanService.findActive();
  }
}
