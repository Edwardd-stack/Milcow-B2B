import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { OrdersView } from '@/components/orders/OrdersView';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/orders'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Orders' });
  return { title: `${t('title')} | Milcow`, description: t('description') };
}

export default function OrdersPage() {
  return (
    // Reads ?status=…&page=… (useSearchParams) → needs a Suspense boundary
    <Suspense fallback={<div className="h-[800px]" />}>
      <OrdersView />
    </Suspense>
  );
}
