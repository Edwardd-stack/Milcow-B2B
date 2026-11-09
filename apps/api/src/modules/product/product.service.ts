import { Injectable, NotFoundException } from '@nestjs/common';
import type { Paginated, ProductDetail, ProductInfo, ProductSort } from '@milcow/shared';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../libs/prisma/prisma.service';
import { toPaginated, toSkipTake } from '../../libs/utils/pagination.util';
import type { ProductListQueryDto } from './dto/product-list-query.dto';
import {
  productDetailInclude,
  productListInclude,
  toProductDetail,
  toProductInfo,
} from './product.mapper';

const ORDER_BY: Record<ProductSort, Prisma.ProductOrderByWithRelationInput> = {
  NEWEST: { createdAt: 'desc' },
  PRICE_ASC: { productPricePerTon: 'asc' },
  PRICE_DESC: { productPricePerTon: 'desc' },
};

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ProductListQueryDto): Promise<Paginated<ProductInfo>> {
    const where: Prisma.ProductWhereInput = {
      productStatus: 'ACTIVE', // the public catalog never shows paused products
      ...(query.productType && { productType: query.productType }),
    };

    // One round-trip for the page and the total count
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: productListInclude,
        orderBy: ORDER_BY[query.sort],
        ...toSkipTake(query.page, query.limit),
      }),
      this.prisma.product.count({ where }),
    ]);

    return toPaginated(rows.map(toProductInfo), total, query.page, query.limit);
  }

  async findOne(id: string): Promise<ProductDetail> {
    const product = await this.prisma.product.findFirst({
      where: { id, productStatus: 'ACTIVE' },
      include: productDetailInclude,
    });
    if (!product) throw new NotFoundException('Product not found');
    return toProductDetail(product);
  }
}
