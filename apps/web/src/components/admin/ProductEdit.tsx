'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@milcow/shared';
import { useAdminProduct } from '@/hooks/useAdmin';
import { ProductForm } from './ProductForm';

/** /admin/products/[id] — loads the product, then the same form as "new" */
export function ProductEdit() {
  const t = useTranslations('Admin');
  const locale = useLocale() as Locale;
  const { id } = useParams<{ id: string }>();
  const { data, isPending, isError } = useAdminProduct(id);

  // Dynamic page → title set here (generateMetadata with params would block prefetching)
  useEffect(() => {
    if (data) document.title = `${data.productName[locale]} · ${t('title')} | Milcow`;
  }, [data, locale, t]);

  if (isError) return <p className="rounded-3xl bg-white p-10 text-muted">{t('errors.generic')}</p>;
  if (isPending) return <div className="h-96 animate-pulse rounded-3xl bg-white" />;
  // key: a fresh form state per product
  return <ProductForm key={data.id} product={data} />;
}
