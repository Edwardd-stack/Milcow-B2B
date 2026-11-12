import type { OrderEventInfo, OrderEventType } from '@milcow/shared';
import type { Prisma } from '../../generated/prisma/client';

type Db = Pick<Prisma.TransactionClient, 'orderEvent'>;

export interface OrderEventInput {
  orderId: string;
  eventType: OrderEventType;
  from?: string | null;
  to?: string | null;
  note?: string | null;
  memberId?: string | null; // null = system (cron, payment)
}

/** Appends one line to the order history. Call it inside the same transaction as the change. */
export function recordOrderEvent(db: Db, input: OrderEventInput) {
  return db.orderEvent.create({
    data: {
      orderId: input.orderId,
      eventType: input.eventType,
      eventFrom: input.from ?? null,
      eventTo: input.to ?? null,
      eventNote: input.note?.slice(0, 500) ?? null,
      memberId: input.memberId ?? null,
    },
  });
}

export const orderEventInclude = {
  member: { select: { memberNick: true, memberType: true } },
} satisfies Prisma.OrderEventInclude;

type OrderEventRow = Prisma.OrderEventGetPayload<{ include: typeof orderEventInclude }>;

export function toOrderEventInfo(event: OrderEventRow): OrderEventInfo {
  return {
    id: event.id,
    eventType: event.eventType,
    eventFrom: event.eventFrom,
    eventTo: event.eventTo,
    eventNote: event.eventNote,
    actor: event.member
      ? { nick: event.member.memberNick, memberType: event.member.memberType }
      : null,
    createdAt: event.createdAt.toISOString(),
  };
}
