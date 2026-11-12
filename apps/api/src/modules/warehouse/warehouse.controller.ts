import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { WarehouseService } from './warehouse.service';

@ApiTags('Warehouses')
@Public()
@Controller('warehouses')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get()
  @ApiOperation({ summary: 'All warehouses (map markers, pickup locations)' })
  findAll() {
    return this.warehouseService.findAll();
  }
}
