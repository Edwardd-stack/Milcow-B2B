import { Suspense } from 'react';
import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { ProductCatalog } from '@/components/products/catalog/ProductCatalog';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { getPublicSnapshot } from '@/lib/public-snapshot';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/products'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Catalog' });
  return { title: `${t('title')} | Milcow`, description: t('description') };
}

export default function ProductsPage() {
  const t = useTranslations('Catalog');
  return (
    <>
      <PageHero title={t('title')} current={t('title')} />
      <Container>
        {/* The catalog reads its filters from the URL (useSearchParams) → needs a Suspense boundary */}
        <Suspense fallback={<div className="h-[600px]" />}>
          <CatalogWithSnapshot />
        </Suspense>
      </Container>
    </>
  );
}

/** Server-cached catalog → the first page of cards is in the HTML, even while the API wakes up */
async function CatalogWithSnapshot() {
  const snapshot = await getPublicSnapshot();
  return <ProductCatalog snapshot={snapshot} />;
}
