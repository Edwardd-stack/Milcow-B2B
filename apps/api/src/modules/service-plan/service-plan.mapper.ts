import type { ServicePlanInfo } from '@milcow/shared';
import type { ServicePlan } from '../../generated/prisma/client';
import { toLocalizedText, toLocalizedTextOrNull } from '../../libs/utils/convert.util';

export function toServicePlanInfo(plan: ServicePlan): ServicePlanInfo {
  return {
    id: plan.id,
    serviceType: plan.serviceType,
    serviceName: toLocalizedText(plan.serviceName),
    serviceDesc: toLocalizedTextOrNull(plan.serviceDesc),
    servicePrice: plan.servicePrice,
    serviceStatus: plan.serviceStatus,
  };
}
