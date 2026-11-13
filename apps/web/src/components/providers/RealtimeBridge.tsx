'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import type { Socket } from 'socket.io-client';
import {
  RealtimeEvent,
  type InquiryCreatedPayload,
  type Locale,
  type OrderCreatedPayload,
} from '@milcow/shared';
import { useMe } from '@/hooks/useAuth';
import { formatKrw } from '@/lib/format';
import { getSocketToken } from '@/services/admin.service';
import { toast } from '@/components/ui/Toaster';

/**
 * One socket per logged-in tab. The server puts it in the right rooms
 * (own orders, own warehouse, admin), and every event simply refreshes the
 * matching React Query caches — the pages re-render with fresh data by themselves.
 */
export function RealtimeBridge() {
  const { data: member } = useMe();
  const queryClient = useQueryClient();
  const t = useTranslations('Realtime');
  const locale = useLocale() as Locale;
  const memberId = member?.id;
  const isAdmin = member?.memberType === 'ADMIN';

  useEffect(() => {
    if (!memberId) return;
    let socket: Socket | null = null;
    let cancelled = false;

    const refresh = (...keys: string[]) =>
      keys.forEach((key) => void queryClient.invalidateQueries({ queryKey: [key] }));

    void (async () => {
      try {
        // Loaded only for members — guests never download the socket client
        const [{ io }, first] = await Promise.all([import('socket.io-client'), getSocketToken()]);
        if (cancelled) return;
        let token: string | null = first.token;
        socket = io(`${first.url}/realtime`, {
          transports: ['websocket'],
          // Called on every (re)connect: the first token is used once, later ones are fetched fresh
          auth: (cb) => {
            if (token) {
              cb({ token });
              token = null;
              return;
            }
            getSocketToken()
              .then((r) => cb({ token: r.token }))
              .catch(() => cb({}));
          },
        });

        socket.on(RealtimeEvent.ORDER_UPDATED, () => refresh('orders', 'admin'));
        socket.on(RealtimeEvent.PICKUP_UPDATED, () => refresh('orders', 'admin'));
        if (isAdmin) {
          socket.on(RealtimeEvent.ORDER_CREATED, (p: OrderCreatedPayload) => {
            refresh('admin');
            toast(t('orderCreated', { total: formatKrw(p.orderTotal, locale) }));
          });
          socket.on(RealtimeEvent.INQUIRY_CREATED, (p: InquiryCreatedPayload) => {
            refresh('admin');
            toast(t('inquiryCreated', { name: p.inquiryName }));
          });
          socket.on(RealtimeEvent.CONTRACT_SUBMITTED, () => {
            refresh('admin');
            toast(t('contractSubmitted'));
          });
        }
      } catch {
        // Realtime is a bonus — pages still work with normal fetching
      }
    })();

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, [memberId, isAdmin, queryClient, t, locale]);

  return null;
}
