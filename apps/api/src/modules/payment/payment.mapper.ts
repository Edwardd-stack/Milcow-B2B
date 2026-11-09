import type { PaymentInfo } from '@milcow/shared';
import type { Payment } from '../../generated/prisma/client';
import { toNumber } from '../../libs/utils/convert.util';

export function toPaymentInfo(payment: Payment): PaymentInfo {
  return {
    id: payment.id,
    orderId: payment.orderId,
    paymentTossOrderId: payment.paymentTossOrderId,
    paymentStatus: payment.paymentStatus,
    paymentMethod: payment.paymentMethod,
    paymentAmount: toNumber(payment.paymentAmount),
    paymentApprovedAt: payment.paymentApprovedAt?.toISOString() ?? null,
    paymentFailReason: payment.paymentFailReason,
  };
}
