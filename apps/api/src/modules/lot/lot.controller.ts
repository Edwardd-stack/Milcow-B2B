import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentMember } from '../../common/decorators/current-member.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthMember } from '../../libs/types/auth.type';
import { ReserveSurplusDto } from './dto/reserve-surplus.dto';
import { SurplusQueryDto } from './dto/surplus-query.dto';
import { LotService } from './lot.service';

@ApiTags('Lots')
@Controller()
export class LotController {
  constructor(private readonly lotService: LotService) {}

  @Public()
  @Get('lots/featured')
  @ApiOperation({ summary: 'Newest milk lots (examples for the passport page)' })
  featured() {
    return this.lotService.featured();
  }

  @Public()
  @Get('lots/:code')
  @ApiOperation({ summary: '원유 품질 여권: origin, lab results, cold-chain log, CO₂e of one lot' })
  passport(@Param('code') code: string) {
    return this.lotService.passport(code);
  }

  @Public()
  @Get('surplus')
  @ApiOperation({ summary: '잉여 원유 매칭: surplus lots with the current dynamic price' })
  surplus(@Query() query: SurplusQueryDto) {
    return this.lotService.surplus(query);
  }

  @Post('surplus/:lotId/reserve')
  @Roles('BUYER')
  @ApiOperation({ summary: 'Reserve tons of a surplus lot — PENDING order, price held 30 minutes' })
  reserve(
    @CurrentMember() member: AuthMember,
    @Param('lotId', ParseUUIDPipe) lotId: string,
    @Body() input: ReserveSurplusDto,
  ) {
    return this.lotService.reserve(member, lotId, input);
  }
}
