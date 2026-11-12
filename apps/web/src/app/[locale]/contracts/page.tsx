import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ContractsView } from '@/components/contracts/ContractsView';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/contracts'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Contracts' });
  return { title: `${t('title')} | Milcow`, description: t('description') };
}

export default function ContractsPage() {
  return (
    // Reads ?product=… (useSearchParams) → needs a Suspense boundary
    <Suspense fallback={<div className="h-[800px]" />}>
      <ContractsView />
    </Suspense>
  );
}
