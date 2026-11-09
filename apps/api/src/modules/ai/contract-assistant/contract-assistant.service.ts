import { Injectable } from '@nestjs/common';
import type {
  ContractDraftField,
  ContractDraftInput,
  ContractDraftIssue,
  ContractDraftPricing,
  ContractDraftResponse,
} from '@milcow/shared';
import { PrismaService } from '../../../libs/prisma/prisma.service';
import { toLocalizedText } from '../../../libs/utils/convert.util';
import { koreaToday, monthlyDates } from '../../../libs/utils/date.util';
import { CONTRACT_MAX_MONTHS } from '../../contract/contract.constants';
import { AiLogService } from '../ai-log.service';
import { GeminiService } from '../gemini.service';
import { contractAssistantInstruction } from './contract-assistant.constants';
import { contractDraftSchema, type ContractDraftModelOutput } from './contract-draft.schema';
import type { ContractDraftRequestDto } from './dto/contract-draft-request.dto';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * AI contract assistant.
 * The model only EXTRACTS what the buyer wants (structured output).
 * Everything that matters — prices, minimums, dates, totals — is checked and calculated here,
 * from the database. The AI never decides a number the buyer will pay.
 */
@Injectable()
export class ContractAssistantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
    private readonly aiLog: AiLogService,
  ) {}

  async draft(dto: ContractDraftRequestDto, memberId: string): Promise<ContractDraftResponse> {
    const startedAt = Date.now();
    const today = koreaToday();
    const catalog = await this.loadCatalog();

    let output: ContractDraftModelOutput;
    try {
      output = await this.gemini.generateJson<ContractDraftModelOutput>(
        this.buildPrompt(dto, catalog),
        contractDraftSchema({
          products: catalog.products.map((p) => p.id),
          warehouses: catalog.warehouses.map((w) => w.id),
          servicePlans: catalog.servicePlans.map((s) => s.id),
        }),
        { systemInstruction: contractAssistantInstruction(dto.locale, today), temperature: 0 },
      );
    } catch (error) {
      await this.log(dto, memberId, startedAt, undefined, error);
      throw error;
    }

    const result = this.validate(output, catalog, today);
    await this.log(dto, memberId, startedAt, JSON.stringify(output));
    return result;
  }

  // ── Validation: never trust model output ──────────────────────────────

  private validate(
    out: ContractDraftModelOutput,
    catalog: Catalog,
    today: string,
  ): ContractDraftResponse {
    const issues: ContractDraftIssue[] = [];

    // Ids must exist (the schema enum already limits them — this is the second lock)
    const product = catalog.products.find((p) => p.id === out.productId) ?? null;
    const warehouse = catalog.warehouses.find((w) => w.id === out.warehouseId) ?? null;
    const plans = catalog.servicePlans.filter((s) => out.servicePlanIds?.includes(s.id));
    if ((out.productId && !product) || (out.warehouseId && !warehouse)) {
      issues.push({
        code: 'UNKNOWN_REFERENCE',
        message: 'The AI chose an unknown product or warehouse',
      });
    }

    const monthlyTon = isPositive(out.monthlyTon) ? round2(out.monthlyTon) : null;
    const months = isPositive(out.months) ? Math.floor(out.months) : null;
    const start = out.startDate && DATE_PATTERN.test(out.startDate) ? out.startDate : null;
    const deliveryType =
      out.deliveryType === 'DELIVERY' || out.deliveryType === 'PICKUP' ? out.deliveryType : null;
    const address = deliveryType === 'DELIVERY' ? out.address?.trim() || null : null;

    // The same business rules as POST /contracts — the buyer sees problems before submitting
    if (product && monthlyTon !== null && monthlyTon < product.minOrderTon) {
      issues.push({
        code: 'BELOW_MIN_ORDER',
        message: `Minimum monthly amount for this product is ${product.minOrderTon} t`,
      });
    }
    if (months !== null && months > CONTRACT_MAX_MONTHS) {
      issues.push({
        code: 'TOO_MANY_MONTHS',
        message: `A contract can have at most ${CONTRACT_MAX_MONTHS} deliveries`,
      });
    }
    if (start && start <= today) {
      issues.push({
        code: 'START_NOT_IN_FUTURE',
        message: 'The first delivery must be after today',
      });
    }

    const deliveryDates = start && months ? monthlyDates(start, '9999-12-31', months) : [];
    const draft: ContractDraftInput = {
      productId: product?.id ?? null,
      warehouseId: warehouse?.id ?? null,
      contractStart: start,
      contractEnd: deliveryDates.at(-1) ?? null,
      contractMonthlyTon: monthlyTon,
      contractDeliveryType: deliveryType,
      contractAddress: address,
      servicePlanIds: plans.map((s) => s.id),
    };

    // Missing is decided by the server from the actual values, not by the model's opinion
    const missing: ContractDraftField[] = [];
    if (!draft.productId) missing.push('product');
    if (!draft.warehouseId) missing.push('warehouse');
    if (draft.contractMonthlyTon === null) missing.push('monthlyTon');
    if (!draft.contractStart) missing.push('startDate');
    if (months === null) missing.push('months');
    if (!draft.contractDeliveryType) missing.push('deliveryType');
    if (draft.contractDeliveryType === 'DELIVERY' && !draft.contractAddress)
      missing.push('address');

    const pricing =
      product && monthlyTon !== null && deliveryDates.length > 0
        ? calculatePricing(product.pricePerTon, monthlyTon, plans, deliveryDates.length)
        : null;

    return {
      draft,
      pricing,
      missing,
      issues,
      explanation: out.explanation?.trim() ?? '',
      ready: missing.length === 0 && issues.length === 0,
    };
  }

  // ── Prompt ────────────────────────────────────────────────────────────

  private buildPrompt(dto: ContractDraftRequestDto, catalog: Catalog): string {
    const lines = (title: string, rows: string[]) =>
      `${title}:\n${rows.map((r) => `- ${r}`).join('\n')}`;
    return [
      lines(
        'PRODUCTS',
        catalog.products.map(
          (p) => `id=${p.id} | ${p.names.ko} / ${p.names.en} | type=${p.type} | grade=${p.grade}`,
        ),
      ),
      lines(
        'WAREHOUSES',
        catalog.warehouses.map((w) => `id=${w.id} | ${w.names.ko} / ${w.names.en} | ${w.address}`),
      ),
      lines(
        'ADD-ON SERVICES',
        catalog.servicePlans.map(
          (s) => `id=${s.id} | ${s.names.ko} / ${s.names.en} | type=${s.type}`,
        ),
      ),
      `<buyer_request>\n${dto.request}\n</buyer_request>`,
    ].join('\n\n');
  }

  private async loadCatalog() {
    const [products, warehouses, servicePlans] = await Promise.all([
      this.prisma.product.findMany({ where: { productStatus: 'ACTIVE' } }),
      this.prisma.warehouse.findMany(),
      this.prisma.servicePlan.findMany({ where: { serviceStatus: 'ACTIVE' } }),
    ]);
    return {
      products: products.map((p) => ({
        id: p.id,
        names: toLocalizedText(p.productName),
        type: p.productType,
        grade: p.productGrade,
        pricePerTon: p.productPricePerTon,
        minOrderTon: p.productMinOrderTon.toNumber(),
      })),
      warehouses: warehouses.map((w) => ({
        id: w.id,
        names: toLocalizedText(w.warehouseName),
        address: w.warehouseAddress,
      })),
      servicePlans: servicePlans.map((s) => ({
        id: s.id,
        names: toLocalizedText(s.serviceName),
        type: s.serviceType,
        price: s.servicePrice,
      })),
    };
  }

  private log(
    dto: ContractDraftRequestDto,
    memberId: string,
    startedAt: number,
    output?: string,
    error?: unknown,
  ) {
    return this.aiLog.record({
      type: 'CONTRACT',
      model: this.gemini.chatModel,
      input: dto.request,
      output,
      error: errorMessage(error),
      latencyMs: Date.now() - startedAt,
      memberId,
    });
  }
}

type Catalog = Awaited<ReturnType<ContractAssistantService['loadCatalog']>>;

/** Same math as the real contract: price per ton is fixed, services are a monthly fee */
function calculatePricing(
  pricePerTon: number,
  monthlyTon: number,
  plans: { price: number }[],
  deliveries: number,
): ContractDraftPricing {
  const monthlyProductTotal = Math.round(pricePerTon * monthlyTon);
  const monthlyServiceFee = plans.reduce((sum, p) => sum + p.price, 0);
  const monthlyTotal = monthlyProductTotal + monthlyServiceFee;
  return {
    pricePerTon,
    monthlyProductTotal,
    monthlyServiceFee,
    monthlyTotal,
    deliveries,
    contractTotal: monthlyTotal * deliveries,
  };
}

const isPositive = (n: number | null | undefined): n is number =>
  typeof n === 'number' && Number.isFinite(n) && n > 0;
const round2 = (n: number) => Math.round(n * 100) / 100;

function errorMessage(error: unknown): string | undefined {
  if (error === undefined) return undefined;
  return error instanceof Error ? error.message : 'Unknown error';
}
