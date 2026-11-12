import type { ContractInfo } from '@milcow/shared';
import type { Prisma } from '../../generated/prisma/client';
import { toLocalizedText, toNumber } from '../../libs/utils/convert.util';
import { monthlyDates, toDateString } from '../../libs/utils/date.util';

export const contractInclude = {
  product: true,
  warehouse: true,
  services: { include: { servicePlan: true }, orderBy: { createdAt: 'asc' } },
} satisfies Prisma.ContractInclude;

type ContractRow = Prisma.ContractGetPayload<{ include: typeof contractInclude }>;

export function toContractInfo(contract: ContractRow): ContractInfo {
  const contractStart = toDateString(contract.contractStart);
  const contractEnd = toDateString(contract.contractEnd);
  const monthlyTon = toNumber(contract.contractMonthlyTon);
  const deliveryDates = monthlyDates(contractStart, contractEnd);
  const servicesPerMonth = contract.services.reduce((sum, s) => sum + s.servicePrice, 0);
  const monthlyTotal = Math.round(monthlyTon * contract.contractPricePerTon) + servicesPerMonth;

  return {
    id: contract.id,
    contractStatus: contract.contractStatus,
    contractStart,
    contractEnd,
    contractMonthlyTon: monthlyTon,
    contractPricePerTon: contract.contractPricePerTon,
    contractDeliveryType: contract.contractDeliveryType,
    contractAddress: contract.contractAddress,
    contractTerms: contract.contractTerms,
    contractPdfUrl: contract.contractPdfUrl,
    memberId: contract.memberId,
    product: {
      id: contract.product.id,
      productName: toLocalizedText(contract.product.productName),
    },
    warehouse: {
      id: contract.warehouse.id,
      warehouseName: toLocalizedText(contract.warehouse.warehouseName),
    },
    services: contract.services.map((s) => ({
      servicePlanId: s.servicePlanId,
      serviceType: s.servicePlan.serviceType,
      serviceName: toLocalizedText(s.servicePlan.serviceName),
      servicePrice: s.servicePrice,
    })),
    contractDeliveryDates: deliveryDates,
    contractMonthlyTotal: monthlyTotal,
    contractTotal: monthlyTotal * deliveryDates.length,
    createdAt: contract.createdAt.toISOString(),
  };
}
