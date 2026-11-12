import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { FarmService } from './farm.service';

@ApiTags('Farms')
@Public()
@Controller('farms')
export class FarmController {
  constructor(private readonly farmService: FarmService) {}

  @Get()
  @ApiOperation({ summary: 'All partner farms (Kakao Map markers)' })
  findAll() {
    return this.farmService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'One farm' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.farmService.findOne(id);
  }
}
