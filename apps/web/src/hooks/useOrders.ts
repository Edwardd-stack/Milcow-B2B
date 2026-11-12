import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Locale } from '@milcow/shared';
import { requestTossPayment } from '@/lib/toss';
import {
  cancelOrder,
  getMyOrders,
  preparePayment,
  type OrderListParams,
} from '@/services/order.service';

export const orderKeys = {
  all: ['orders'] as const,
  list: (params: OrderListParams) => [...orderKeys.all, 'list', params] as const,
};

/** "My orders" — the tab + page are part of the key, so each one is cached on its own */
export function useMyOrders(params: OrderListParams, enabled = true) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => getMyOrders(params),
    placeholderData: keepPreviousData, // switching tab/page keeps the old rows until the new ones arrive
    enabled,
  });
}

/** Cancel a PENDING order → the stock goes back, every order list is refetched */
export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => cancelOrder(orderId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orderKeys.all }),
  });
}

/**
 * Pay an order that already exists (PENDING, e.g. a monthly contract order or a closed Toss window).
 * Same flow as checkout, minus creating the order: prepare (server sets the amount) → Toss window.
 * Unlike checkout we do NOT cancel on failure — the order was there before and stays payable.
 */
export function usePayOrder() {
  return useMutation({
    mutationFn: async ({
      orderId,
      memberId,
      locale,
    }: {
      orderId: string;
      memberId: string;
      locale: Locale;
    }) => {
      const payment = await preparePayment(orderId);
      const base = `${window.location.origin}/${locale}/checkout`;
      await requestTossPayment(memberId, {
        amount: { currency: 'KRW', value: payment.amount },
        orderId: payment.tossOrderId,
        orderName: payment.orderName,
        customerEmail: payment.customerEmail,
        customerName: payment.customerName,
        successUrl: `${base}/success`,
        failUrl: `${base}/fail`,
      });
    },
  });
}
