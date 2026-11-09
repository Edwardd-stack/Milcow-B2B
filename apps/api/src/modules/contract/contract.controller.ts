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
  StreamableFile,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { CurrentMember } from '../../common/decorators/current-member.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthMember } from '../../libs/types/auth.type';
import { ContractService } from './contract.service';
import { ContractPdfService } from './pdf/contract-pdf.service';
import { ContractListQueryDto } from './dto/contract-list-query.dto';
import { ContractPdfQueryDto } from './dto/contract-pdf-query.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { RunMonthlyOrdersDto } from './dto/run-monthly-orders.dto';
import { UpdateContractStatusDto } from './dto/update-contract-status.dto';

@ApiTags('Contracts')
@ApiBearerAuth()
@Roles('BUYER', 'ADMIN')
@Controller('contracts')
export class ContractController {
  constructor(
    private readonly contractService: ContractService,
    private readonly contractPdf: ContractPdfService,
  ) {}

  @Post()
  @Roles('BUYER')
  @ApiOperation({ summary: 'Create a contract draft (prices are fixed now)' })
  create(@CurrentMember() member: AuthMember, @Body() input: CreateContractDto) {
    return this.contractService.create(member, input);
  }

  @Get()
  @ApiOperation({ summary: 'Contracts: buyer → own, admin → all' })
  findAll(@CurrentMember() member: AuthMember, @Query() query: ContractListQueryDto) {
    return this.contractService.findAll(member, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'One contract with totals and delivery dates' })
  findOne(@CurrentMember() member: AuthMember, @Param('id', ParseUUIDPipe) id: string) {
    return this.contractService.findOne(member, id);
  }

  @Get(':id/pdf')
  @ApiProduces('application/pdf')
  @ApiOperation({ summary: 'Contract as a PDF document (ko / en / uz)' })
  async pdf(
    @CurrentMember() member: AuthMember,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ContractPdfQueryDto,
  ): Promise<StreamableFile> {
    const contract = await this.contractService.findOne(member, id); // same visibility rules
    const file = await this.contractPdf.render(contract, query.locale);
    return new StreamableFile(file, {
      type: 'application/pdf',
      disposition: `inline; filename="milcow-contract-${id.slice(-12)}.pdf"`,
    });
  }

  @Patch(':id/submit')
  @Roles('BUYER')
  @ApiOperation({ summary: 'Send the draft to Milcow for review (DRAFT → REVIEW)' })
  submit(@CurrentMember() member: AuthMember, @Param('id', ParseUUIDPipe) id: string) {
    return this.contractService.updateStatus(member, id, 'REVIEW');
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel (buyer: before approval, admin: any time)' })
  cancel(@CurrentMember() member: AuthMember, @Param('id', ParseUUIDPipe) id: string) {
    return this.contractService.updateStatus(member, id, 'CANCELLED');
  }

  @Patch(':id/status')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Approve / end a contract' })
  updateStatus(
    @CurrentMember() member: AuthMember,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() input: UpdateContractStatusDto,
  ) {
    return this.contractService.updateStatus(member, id, input.contractStatus);
  }

  @Post('monthly-orders/run')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run the daily contract-order job now (normally runs at 01:00 KST)' })
  runMonthlyOrders(@Body() input: RunMonthlyOrdersDto) {
    return this.contractService.runMonthlyOrders(input.date);
  }
}
