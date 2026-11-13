import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ContractsAdmin } from '@/components/admin/ContractsAdmin';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/admin/contracts'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Admin' });
  return { title: `${t('nav.contracts')} · ${t('title')} | Milcow` };
}

// Rendered only after the client knows the role (AdminShell) → not prerenderable for instant nav
export const instant = false;

export default function Page() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-white" />}>
      <ContractsAdmin />
    </Suspense>
  );
}
