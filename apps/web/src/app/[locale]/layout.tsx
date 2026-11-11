import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Noto_Sans_KR, Poppins } from 'next/font/google';
import { notFound } from 'next/navigation';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { ChatProvider } from '@/components/ai/ChatProvider';
import { ChatWidget } from '@/components/ai/ChatWidget';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { routing } from '@/i18n/routing';
import '../globals.css';

// Poppins — the template's font (Latin only)
const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
});

// Korean glyphs; loaded on demand per character range, so no preload
const notoKr = Noto_Sans_KR({
  variable: '--font-noto-kr',
  weight: ['400', '500', '700', '800'],
  preload: false,
});

// Pre-render every page once per language: /ko, /en, /uz
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html
      lang={locale}
      className={`${poppins.variable} ${notoKr.variable} h-full scroll-smooth antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* Translations + server-state cache for Client Components */}
        <NextIntlClientProvider>
          <QueryProvider>
            <ChatProvider>
              {/* The header reads the current path (active menu item). On routes with a runtime
                  segment (/products/[id]) that is only known per request → Suspense lets the rest
                  of the page prerender; the fallback keeps the header's height (no layout shift). */}
              <Suspense fallback={<div className="h-[81px] bg-brand" />}>
                <Header />
              </Suspense>
              <main className="flex flex-1 flex-col">{children}</main>
              <Footer />
              <ScrollToTop />
              <ChatWidget />
            </ChatProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
