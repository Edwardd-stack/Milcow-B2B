'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@milcow/shared';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';
import { QrScanner, useCanScanQr } from '@/components/ui/QrScanner';
import { extractLotCode, useFeaturedLots } from '@/hooks/useLots';
import { Link, useRouter } from '@/i18n/navigation';
import { GradeBadges } from './GradeBadges';

/** /passport — enter a lot number or scan its QR; examples below */
export function PassportSearch() {
  const t = useTranslations('Passport');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [text, setText] = useState('');
  const [error, setError] = useState(false);
  const [scanning, setScanning] = useState(false);
  const featured = useFeaturedLots();
  const canScan = useCanScanQr();

  const open = (value: string) => {
    const code = extractLotCode(value);
    if (!code) return setError(true);
    router.push(`/passport/${code}`);
  };

  return (
    <>
      <PageHero title={t('title')} current={t('title')} />
      <Container>
        <div className="relative -mt-16 mb-24 min-[100rem]:-mt-[calc(6.95vw-1rem)]">
          <section className="mx-auto max-w-3xl rounded-3xl bg-white p-6 text-center shadow-[0_20px_50px_rgba(17,55,95,0.1)] sm:p-10">
            <p className="text-sm font-semibold tracking-[0.18em] text-brand uppercase">
              {t('eyebrow')}
            </p>
            <h2 className="mt-2 text-2xl font-extrabold text-heading sm:text-[28px]">
              {t('heading')}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">{t('lead')}</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                open(text);
              }}
              className="mt-7 flex flex-col gap-2 sm:flex-row"
            >
              <input
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setError(false);
                }}
                placeholder="ML-20261113-ICN-01"
                aria-label={t('inputLabel')}
                className="h-[54px] flex-1 rounded-full border border-line px-5 font-mono text-[15px] uppercase outline-none transition placeholder:normal-case placeholder:text-soft focus:border-brand focus:ring-4 focus:ring-brand/12"
              />
              <button
                type="submit"
                className="h-[54px] rounded-full bg-brand px-8 font-semibold text-white transition hover:bg-navy"
              >
                {t('search')}
              </button>
              {canScan && (
                <button
                  type="button"
                  onClick={() => setScanning(true)}
                  className="h-[54px] rounded-full border border-brand px-6 font-semibold text-brand transition hover:bg-brand hover:text-white"
                >
                  {t('scan')}
                </button>
              )}
            </form>
            {error && <p className="mt-3 text-sm text-[#b42318]">{t('invalidCode')}</p>}
            {scanning && (
              <div className="mt-5">
                <QrScanner
                  onResult={(value) => {
                    setScanning(false);
                    open(value);
                  }}
                  onClose={() => setScanning(false)}
                />
              </div>
            )}
          </section>

          <section className="mt-12">
            <h3 className="mb-4 text-lg font-bold text-heading">{t('examples')}</h3>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(featured.data ?? []).map((lot) => (
                <li key={lot.id}>
                  <Link
                    href={`/passport/${lot.lotCode}`}
                    className="block rounded-3xl bg-white p-5 shadow-[0_14px_40px_rgba(17,55,95,0.08)] transition hover:-translate-y-0.5"
                  >
                    <p className="font-mono text-sm font-bold text-brand">{lot.lotCode}</p>
                    <p className="mt-1 font-semibold text-heading">{lot.productName[locale]}</p>
                    <p className="text-xs text-muted">{lot.farmName[locale]}</p>
                    <GradeBadges
                      bacteria={lot.lotBacteriaGrade}
                      somatic={lot.lotSomaticGrade}
                      className="mt-3"
                    />
                  </Link>
                </li>
              ))}
              {featured.isPending &&
                [0, 1, 2].map((i) => (
                  <li key={i} className="h-[132px] animate-pulse rounded-3xl bg-white" />
                ))}
            </ul>
          </section>
        </div>
      </Container>
    </>
  );
}
