import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ProductType,
  type Paginated,
  type ProductDetail,
  type ProductFacets,
  type ProductInfo,
  type ProductSort,
} from '@milcow/shared';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../libs/prisma/prisma.service';
import { toPaginated, toSkipTake } from '../../libs/utils/pagination.util';
import type { ProductListQueryDto } from './dto/product-list-query.dto';
import {
  productDetailInclude,
  productListInclude,
  toProductDetail,
  toProductInfo,
} from './product.mapper';

// Postgres sorts enums in their declared order: RAW_MILK, CREAM, BUTTER, CHEESE, YOGURT, MILK_POWDER
// and PREMIUM, GRADE_1, GRADE_2. RECOMMENDED is then interleaved by type in findRecommended().
const ORDER_BY: Record<ProductSort, Prisma.ProductOrderByWithRelationInput[]> = {
  RECOMMENDED: [{ productType: 'asc' }, { productGrade: 'asc' }, { productPricePerTon: 'desc' }],
  NEWEST: [{ createdAt: 'desc' }],
  PRICE_ASC: [{ productPricePerTon: 'asc' }],
  PRICE_DESC: [{ productPricePerTon: 'desc' }],
};

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ProductListQueryDto): Promise<Paginated<ProductInfo>> {
    const where = await this.buildWhere(query);
    if (query.sort === 'RECOMMENDED') return this.findRecommended(where, query);

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

  /**
   * "Recommended" = take turns between the types, so the first page shows variety:
   *   raw milk #1 → cream #1 → butter #1 → … → powder #1 → raw milk #2 → cream #2 → …
   * (#1 = best grade of that type). SQL ORDER BY can't express "round robin" simply,
   * so we sort the light id/type/grade rows here and load full data only for one page.
   * Fine for a catalog of hundreds of products.
   */
  private async findRecommended(
    where: Prisma.ProductWhereInput,
    query: ProductListQueryDto,
  ): Promise<Paginated<ProductInfo>> {
    const light = await this.prisma.product.findMany({
      where,
      select: { id: true, productType: true },
      orderBy: ORDER_BY.RECOMMENDED, // type → grade → price, so the index below = rank inside its type
    });

    const typeOrder = Object.values(ProductType);
    const rankInType = new Map<string, number>();
    const seen = new Map<string, number>();
    for (const row of light) {
      const rank = seen.get(row.productType) ?? 0;
      rankInType.set(row.id, rank);
      seen.set(row.productType, rank + 1);
    }
    const ordered = [...light].sort(
      (a, b) =>
        rankInType.get(a.id)! - rankInType.get(b.id)! ||
        typeOrder.indexOf(a.productType) - typeOrder.indexOf(b.productType),
    );

    const { skip, take } = toSkipTake(query.page, query.limit);
    const pageIds = ordered.slice(skip, skip + take).map((row) => row.id);
    const rows = await this.prisma.product.findMany({
      where: { id: { in: pageIds } },
      include: productListInclude,
    });
    const byId = new Map(rows.map((row) => [row.id, row]));
    const page = pageIds.flatMap((id) => {
      const row = byId.get(id);
      return row ? [toProductInfo(row)] : [];
    });

    return toPaginated(page, light.length, query.page, query.limit);
  }

  /** Counts per type + price range — for the catalog sidebar (whole active catalog, not the filtered page) */
  async facets(): Promise<ProductFacets> {
    const active = { productStatus: 'ACTIVE' } as const;
    const [groups, price] = await this.prisma.$transaction([
      this.prisma.product.groupBy({
        by: ['productType'],
        where: active,
        _count: { _all: true },
        orderBy: { productType: 'asc' },
      }),
      this.prisma.product.aggregate({
        where: active,
        _min: { productPricePerTon: true },
        _max: { productPricePerTon: true },
      }),
    ]);

    const byType = Object.fromEntries(
      Object.values(ProductType).map((type) => [type, 0]),
    ) as Record<ProductType, number>;
    let total = 0;
    for (const group of groups) {
      const count = typeof group._count === 'object' ? (group._count._all ?? 0) : 0;
      byType[group.productType] = count;
      total += count;
    }
    return {
      total,
      byType,
      priceMin: price._min.productPricePerTon ?? 0,
      priceMax: price._max.productPricePerTon ?? 0,
    };
  }

  private async buildWhere(query: ProductListQueryDto): Promise<Prisma.ProductWhereInput> {
    const and: Prisma.ProductWhereInput[] = [
      { productStatus: 'ACTIVE' }, // the public catalog never shows paused products
    ];
    if (query.productType) and.push({ productType: query.productType });
    if (query.grades?.length) and.push({ productGrade: { in: query.grades } });
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      and.push({ productPricePerTon: { gte: query.minPrice, lte: query.maxPrice } });
    }

    // Stock: in the chosen warehouses, or anywhere when only "in stock" is ticked
    if (query.warehouseIds?.length) {
      and.push({
        inventories: { some: { warehouseId: { in: query.warehouseIds }, inventoryTon: { gt: 0 } } },
      });
    } else if (query.inStock) {
      and.push({ inventories: { some: { inventoryTon: { gt: 0 } } } });
    }

    if (query.q?.trim()) and.push({ id: { in: await this.searchIds(query.q.trim()) } });
    return { AND: and };
  }

  /**
   * productName is JSON { ko, en, uz } — Prisma's JSON filters are case-sensitive,
   * so this one search runs in SQL: any of the three names ILIKE %q% (parameterised, no injection).
   */
  private async searchIds(q: string): Promise<string[]> {
    const pattern = `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
    const rows = await this.prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT p.id FROM products p
      WHERE EXISTS (
        SELECT 1 FROM jsonb_each_text(p.product_name) AS name WHERE name.value ILIKE ${pattern}
      )`);
    return rows.map((row) => row.id);
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
