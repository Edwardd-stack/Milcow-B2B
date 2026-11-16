import { Suspense } from 'react';
import { AboutSection } from '@/components/home/AboutSection';
import { CtaSection } from '@/components/home/CtaSection';
import { CustomersSection } from '@/components/home/CustomersSection';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { Hero } from '@/components/home/Hero';
import { FlowBackdrop } from '@/components/home/FlowBackdrop';
import { HowItWorks } from '@/components/home/HowItWorks';
import { MapSection } from '@/components/home/MapSection';
import { TrustedSection } from '@/components/home/TrustedSection';
import { getPublicSnapshot } from '@/lib/public-snapshot';

/** Home — sections are added one by one, in the template's order */
export default function HomePage() {
  return (
    <>
      <Hero />
      {/* About → Trusted share one decorative background */}
      <div className="relative isolate">
        <FlowBackdrop />
        <AboutSection />
        <TrustedSection />
      </div>
      {/* Products / farms / warehouses come from the server cache → on screen even while the API
          wakes up. Suspense: React Query reads the clock for the cached copy, so these two
          parts render per request (the cached snapshot keeps that instant). */}
      <Suspense fallback={<FeaturedProducts />}>
        <FeaturedWithSnapshot />
      </Suspense>
      <HowItWorks />
      <Suspense fallback={<MapSection />}>
        <MapWithSnapshot />
      </Suspense>
      <CustomersSection />
      <CtaSection />
    </>
  );
}

async function FeaturedWithSnapshot() {
  return <FeaturedProducts snapshot={await getPublicSnapshot()} />;
}

async function MapWithSnapshot() {
  return <MapSection snapshot={await getPublicSnapshot()} />;
}
