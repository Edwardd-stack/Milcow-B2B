import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CheckoutFail } from '@/components/checkout/CheckoutResult';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/checkout/fail'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Checkout' });
  return { title: `${t('fail.title')} | Milcow`, robots: { index: false } };
}

export default function Page() {
  return (
    // Reads the URL's query string (useSearchParams) → needs a Suspense boundary
    <Suspense fallback={<div className="h-[700px]" />}>
      <CheckoutFail />
    </Suspense>
  );
}
