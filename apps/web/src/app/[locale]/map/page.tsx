import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { PlaceExplorer } from '@/components/map/PlaceExplorer';
import { Container } from '@/components/ui/Container';
import { PageHero } from '@/components/ui/PageHero';

export async function generateMetadata({ params }: PageProps<'/[locale]/map'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'MapPage' });
  return { title: `${t('title')} | Milcow`, description: t('description') };
}

export default function MapPage() {
  const t = useTranslations('MapPage');
  return (
    <>
      <PageHero title={t('title')} current={t('title')} />
      <Container>
        <PlaceExplorer />
      </Container>
    </>
  );
}
