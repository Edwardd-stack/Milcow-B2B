import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentMember } from '../../common/decorators/current-member.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthMember } from '../../libs/types/auth.type';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderListQueryDto } from './dto/order-list-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderService } from './order.service';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @Roles('BUYER')
  @ApiOperation({ summary: 'Place an order (reserves stock)' })
  create(@CurrentMember() member: AuthMember, @Body() input: CreateOrderDto) {
    return this.orderService.create(member, input);
  }

  @Get()
  @ApiOperation({ summary: 'Orders: buyer → own, staff → own warehouse, admin → all' })
  findAll(@CurrentMember() member: AuthMember, @Query() query: OrderListQueryDto) {
    return this.orderService.findAll(member, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'One order' })
  findOne(@CurrentMember() member: AuthMember, @Param('id', ParseUUIDPipe) id: string) {
    return this.orderService.findOne(member, id);
  }

  @Patch(':id/cancel')
  @Roles('BUYER', 'ADMIN')
  @ApiOperation({
    summary: 'Cancel — buyer: unpaid only; admin: unpaid or paid (refunded). Stock is returned',
  })
  cancel(
    @CurrentMember() member: AuthMember,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: CancelOrderDto,
  ) {
    return this.orderService.cancel(member, id, input.reason);
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Move the order to the next status' })
  updateStatus(
    @CurrentMember() member: AuthMember,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(member, id, input.orderStatus);
  }
}
