import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AdminShell } from '@/components/admin/AdminShell';

export async function generateMetadata({
  params,
}: LayoutProps<'/[locale]/admin'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Admin' });
  // An internal tool — keep it out of search engines
  return { title: `${t('title')} | Milcow`, robots: { index: false, follow: false } };
}

export default function AdminLayout({ children }: LayoutProps<'/[locale]/admin'>) {
  // AdminShell reads the path (active menu, staff redirect) → Suspense for prerendering
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex-1 bg-cream" />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
