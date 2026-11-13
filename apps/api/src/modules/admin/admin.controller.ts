import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { CurrentMember } from '../../common/decorators/current-member.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthMember } from '../../libs/types/auth.type';
import { OrderListQueryDto } from '../order/dto/order-list-query.dto';
import { OrderService } from '../order/order.service';
import { COPILOT_RATE_LIMIT } from './admin.constants';
import { AdminProductService } from './admin-product.service';
import { AnalyticsService } from './analytics.service';
import { CopilotService } from './copilot.service';
import { CopilotDto } from './dto/copilot.dto';
import { ProductAdminDto, ProductStatusDto } from './dto/product-admin.dto';

/** Admin console API. Every route: ADMIN only (STAFF uses the pickup routes). */
@ApiTags('Admin')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly analytics: AnalyticsService,
    private readonly orders: OrderService,
    private readonly products: AdminProductService,
    private readonly copilot: CopilotService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Dashboard numbers: today, this month, 14-day chart, queues' })
  stats(@CurrentMember() member: AuthMember) {
    return this.analytics.stats(member);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Order table with filters (status, type, warehouse, dates, search)' })
  orderRows(@CurrentMember() member: AuthMember, @Query() query: OrderListQueryDto) {
    return this.orders.findAdminRows(member, query);
  }

  @Get('products')
  @ApiOperation({ summary: 'All products incl. paused, with stock per warehouse' })
  productList() {
    return this.products.findAll();
  }

  @Get('products/:id')
  productOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.products.findOne(id);
  }

  @Post('products')
  @ApiOperation({ summary: 'Create a product (SKU is assigned by the server)' })
  productCreate(@CurrentMember() member: AuthMember, @Body() input: ProductAdminDto) {
    return this.products.create(member, input);
  }

  @Patch('products/:id')
  productUpdate(
    @CurrentMember() member: AuthMember,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: ProductAdminDto,
  ) {
    return this.products.update(member, id, input);
  }

  @Patch('products/:id/status')
  @ApiOperation({ summary: 'Pause / resume selling a product' })
  productStatus(
    @CurrentMember() member: AuthMember,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: ProductStatusDto,
  ) {
    return this.products.setStatus(member, id, input.productStatus);
  }

  @Post('copilot')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: COPILOT_RATE_LIMIT })
  @ApiOperation({ summary: 'Ask the ops copilot (read-only, whitelisted analytics tools)' })
  ask(@CurrentMember() member: AuthMember, @Body() input: CopilotDto) {
    return this.copilot.ask(member, input.question, input.locale);
  }
}
