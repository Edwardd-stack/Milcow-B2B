import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { ProductAdminInfo, ProductStatus } from '@milcow/shared';
import { Prisma } from '../../generated/prisma/client';
import { assertDemoCanModify } from '../../common/policies/demo.policy';
import { PrismaService } from '../../libs/prisma/prisma.service';
import type { AuthMember } from '../../libs/types/auth.type';
import {
  toLocalizedText,
  toLocalizedTextOrNull,
  toNumberOrNull,
} from '../../libs/utils/convert.util';
import { nextSku } from '../product/product-sku';
import type { ProductAdminDto } from './dto/product-admin.dto';

const productAdminInclude = {
  inventories: { include: { warehouse: true }, orderBy: { warehouse: { createdAt: 'asc' } } },
} satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof productAdminInclude }>;

function toProductAdminInfo(product: ProductRow): ProductAdminInfo {
  const stock = product.inventories.map((inv) => ({
    warehouseId: inv.warehouseId,
    warehouseName: toLocalizedText(inv.warehouse.warehouseName),
    inventoryTon: inv.inventoryTon.toNumber(),
  }));
  return {
    id: product.id,
    productSku: product.productSku,
    productType: product.productType,
    productGrade: product.productGrade,
    productStatus: product.productStatus,
    productName: toLocalizedText(product.productName),
    productDesc: toLocalizedTextOrNull(product.productDesc),
    productFatPct: toNumberOrNull(product.productFatPct),
    productProteinPct: toNumberOrNull(product.productProteinPct),
    productPricePerTon: product.productPricePerTon,
    productMinOrderTon: product.productMinOrderTon.toNumber(),
    stock,
    totalStockTon: stock.reduce((sum, s) => sum + s.inventoryTon, 0),
    updatedAt: product.updatedAt.toISOString(),
  };
}

/**
 * Catalog management (ADMIN). The public catalog is shared by every visitor,
 * so a demo admin can look at every screen but cannot save catalog changes.
 */
@Injectable()
export class AdminProductService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ProductAdminInfo[]> {
    const products = await this.prisma.product.findMany({
      include: productAdminInclude,
      orderBy: [{ productSku: 'asc' }, { createdAt: 'asc' }],
    });
    return products.map(toProductAdminInfo);
  }

  async findOne(id: string): Promise<ProductAdminInfo> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: productAdminInclude,
    });
    if (!product) throw new NotFoundException('Product not found');
    return toProductAdminInfo(product);
  }

  async create(member: AuthMember, input: ProductAdminDto): Promise<ProductAdminInfo> {
    assertDemoCanModify(member, false);
    const product = await this.prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: { ...this.productData(input), productSku: await nextSku(tx, input.productType) },
      });
      await this.saveStock(tx, created.id, input);
      return tx.product.findUniqueOrThrow({
        where: { id: created.id },
        include: productAdminInclude,
      });
    });
    return toProductAdminInfo(product);
  }

  async update(member: AuthMember, id: string, input: ProductAdminDto): Promise<ProductAdminInfo> {
    assertDemoCanModify(member, false);
    const current = await this.prisma.product.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Product not found');
    if (current.productType !== input.productType) {
      // The SKU encodes the type (MC-RAW-…) — create a new product instead
      throw new ConflictException('Product type cannot be changed');
    }
    const product = await this.prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data: this.productData(input) });
      await this.saveStock(tx, id, input);
      return tx.product.findUniqueOrThrow({ where: { id }, include: productAdminInclude });
    });
    return toProductAdminInfo(product);
  }

  async setStatus(member: AuthMember, id: string, status: ProductStatus) {
    assertDemoCanModify(member, false);
    const product = await this.prisma.product
      .update({ where: { id }, data: { productStatus: status }, include: productAdminInclude })
      .catch((error: unknown) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          throw new NotFoundException('Product not found');
        }
        throw error;
      });
    return toProductAdminInfo(product);
  }

  private productData(input: ProductAdminDto) {
    return {
      productType: input.productType,
      productGrade: input.productGrade,
      productStatus: input.productStatus,
      productName: { ...input.productName },
      productDesc: input.productDesc ? { ...input.productDesc } : Prisma.DbNull,
      productFatPct: input.productFatPct ?? null,
      productProteinPct: input.productProteinPct ?? null,
      productPricePerTon: input.productPricePerTon,
      productMinOrderTon: input.productMinOrderTon,
    };
  }

  /** Upsert one stock row per warehouse given in the form */
  private async saveStock(tx: Prisma.TransactionClient, productId: string, input: ProductAdminDto) {
    for (const row of input.stock) {
      await tx.inventory.upsert({
        where: { productId_warehouseId: { productId, warehouseId: row.warehouseId } },
        create: { productId, warehouseId: row.warehouseId, inventoryTon: row.inventoryTon },
        update: { inventoryTon: row.inventoryTon },
      });
    }
  }
}
