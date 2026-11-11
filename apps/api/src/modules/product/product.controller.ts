import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ProductListQueryDto } from './dto/product-list-query.dto';
import { ProductService } from './product.service';

@ApiTags('Products')
@Public()
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({
    summary: 'Product catalog (type, grade, warehouse, price, stock, search, sort, paginate)',
  })
  findAll(@Query() query: ProductListQueryDto) {
    return this.productService.findAll(query);
  }

  @Get('facets')
  @ApiOperation({ summary: 'Counts per product type and the price range (catalog filters)' })
  facets() {
    return this.productService.facets();
  }

  @Get(':id/neighbors')
  @ApiOperation({ summary: 'Previous / next product in the default catalog order' })
  neighbors(@Param('id', ParseUUIDPipe) id: string) {
    return this.productService.neighbors(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Product detail with stock per warehouse' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productService.findOne(id);
  }
}
