import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentMember } from '../../common/decorators/current-member.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthMember } from '../../libs/types/auth.type';
import { CreatePickupDto } from './dto/create-pickup.dto';
import { PickupListQueryDto } from './dto/pickup-list-query.dto';
import { PickupSlotQueryDto } from './dto/pickup-slot-query.dto';
import { UpdatePickupStatusDto } from './dto/update-pickup-status.dto';
import { PickupService } from './pickup.service';

@ApiTags('Pickups')
@ApiBearerAuth()
@Controller()
export class PickupController {
  constructor(private readonly pickupService: PickupService) {}

  @Public()
  @Get('pickup-slots')
  @ApiOperation({ summary: 'Free time slots of a warehouse on a day' })
  findSlots(@Query() query: PickupSlotQueryDto) {
    return this.pickupService.findSlots(query);
  }

  @Post('pickups')
  @Roles('BUYER')
  @ApiOperation({ summary: 'Book a pickup time for a PICKUP order' })
  create(@CurrentMember() member: AuthMember, @Body() input: CreatePickupDto) {
    return this.pickupService.create(member, input);
  }

  @Get('pickups')
  @ApiOperation({ summary: 'Pickups: buyer → own, staff → own warehouse, admin → all' })
  findAll(@CurrentMember() member: AuthMember, @Query() query: PickupListQueryDto) {
    return this.pickupService.findAll(member, query);
  }

  @Get('pickups/code/:code')
  @Roles('STAFF', 'ADMIN')
  @ApiOperation({ summary: 'Find a pickup by the code the driver shows at the gate' })
  findByCode(@CurrentMember() member: AuthMember, @Param('code') code: string) {
    return this.pickupService.findByCode(member, code);
  }

  @Patch('pickups/:id/status')
  @Roles('STAFF', 'ADMIN')
  @ApiOperation({ summary: 'SCHEDULED → LOADING → READY → PICKED_UP (order status follows)' })
  updateStatus(
    @CurrentMember() member: AuthMember,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: UpdatePickupStatusDto,
  ) {
    return this.pickupService.updateStatus(member, id, input.pickupStatus);
  }

  @Delete('pickups/:id')
  @Roles('BUYER', 'ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel a booking (only before loading starts)' })
  cancel(@CurrentMember() member: AuthMember, @Param('id', ParseUUIDPipe) id: string) {
    return this.pickupService.cancel(member, id);
  }
}
