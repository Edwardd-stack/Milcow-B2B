import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { PaymentInfo, PaymentPrepareResponse } from '@milcow/shared';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../libs/prisma/prisma.service';
import { TossPaymentsClient, TossPaymentsError } from '../../libs/toss/toss-payments.client';
import type { AuthMember } from '../../libs/types/auth.type';
import { toLocalizedText, toNumber } from '../../libs/utils/convert.util';
import { RealtimeService } from '../realtime/realtime.service';
import type { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import type { FailPaymentDto } from './dto/fail-payment.dto';
import { toPaymentInfo } from './payment.mapper';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly toss: TossPaymentsClient,
    private readonly realtime: RealtimeService,
  ) {}

  /** Step 1: create a READY payment. The amount is taken from the order in our database. */
  async prepare(member: AuthMember, orderId: string): Promise<PaymentPrepareResponse> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, memberId: member.id },
      include: { member: true, items: { include: { product: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.orderStatus !== 'PENDING')
      throw new ConflictException('This order is not waiting for payment');

    const payment = await this.prisma.payment.create({
      data: {
        order: { connect: { id: order.id } },
        paymentTossOrderId: `MC-${randomUUID()}`, // unique per attempt; Toss allows 6–64 chars
        paymentAmount: order.orderTotal,
      },
    });

    const [first, ...rest] = order.items;
    const firstName = first ? toLocalizedText(first.product.productName).ko : '유제품';
    const orderName = rest.length > 0 ? `${firstName} 외 ${rest.length}건` : firstName;

    return {
      paymentId: payment.id,
      tossOrderId: payment.paymentTossOrderId,
      amount: toNumber(payment.paymentAmount),
      orderName,
      customerEmail: order.member.memberEmail,
      customerName: order.member.memberCompanyName ?? order.member.memberNick,
    };
  }

  /** Step 2 (after the Toss window): verify the amount, ask Toss to charge, mark the order PAID. */
  async confirm(member: AuthMember, input: ConfirmPaymentDto): Promise<PaymentInfo> {
    const payment = await this.prisma.payment.findFirst({
      where: { paymentTossOrderId: input.tossOrderId, order: { memberId: member.id } },
      include: { order: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.paymentStatus !== 'READY')
      throw new ConflictException('This payment is already processed');
    if (payment.order.orderStatus !== 'PENDING')
      throw new ConflictException('This order is not waiting for payment');

    // The amount in the success URL can be edited by the user — trust only our own record
    if (!payment.paymentAmount.equals(input.amount)) {
      await this.markFailed(payment.id, 'Amount does not match the order');
      throw new BadRequestException('Payment amount does not match the order');
    }

    // Call Toss OUTSIDE a database transaction — a slow network call must not lock rows
    let tossPayment;
    try {
      tossPayment = await this.toss.confirm(input.paymentKey, input.tossOrderId, input.amount);
    } catch (error) {
      if (error instanceof TossPaymentsError) {
        await this.markFailed(payment.id, `${error.code}: ${error.message}`);
        throw new BadRequestException(error.message);
      }
      this.logger.error(
        'Toss confirm failed',
        error instanceof Error ? error.stack : String(error),
      );
      throw new BadGatewayException('Payment provider is not reachable, please try again');
    }

    const [updatedPayment, order] = await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          paymentStatus: 'DONE',
          paymentKey: tossPayment.paymentKey,
          paymentMethod: tossPayment.method,
          paymentApprovedAt: tossPayment.approvedAt ? new Date(tossPayment.approvedAt) : new Date(),
        },
      }),
      this.prisma.order.update({ where: { id: payment.orderId }, data: { orderStatus: 'PAID' } }),
    ]);

    this.realtime.orderUpdated(
      {
        orderId: order.id,
        orderStatus: order.orderStatus,
        updatedAt: order.updatedAt.toISOString(),
      },
      order.memberId,
      order.warehouseId,
    );
    return toPaymentInfo(updatedPayment);
  }

  /** The buyer closed the Toss window or the card was rejected (failUrl). */
  async fail(member: AuthMember, input: FailPaymentDto): Promise<PaymentInfo> {
    const payment = await this.prisma.payment.findFirst({
      where: { paymentTossOrderId: input.tossOrderId, order: { memberId: member.id } },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.paymentStatus !== 'READY') return toPaymentInfo(payment);

    const reason = [input.code, input.message].filter(Boolean).join(': ') || 'Payment failed';
    return toPaymentInfo(await this.markFailed(payment.id, reason));
  }

  private markFailed(id: string, reason: string) {
    return this.prisma.payment.update({
      where: { id },
      data: { paymentStatus: 'FAILED', paymentFailReason: reason.slice(0, 500) },
    });
  }
}
