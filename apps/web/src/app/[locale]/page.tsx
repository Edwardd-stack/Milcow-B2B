import { AboutSection } from '@/components/home/AboutSection';
import { CtaSection } from '@/components/home/CtaSection';
import { CustomersSection } from '@/components/home/CustomersSection';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { Hero } from '@/components/home/Hero';
import { FlowBackdrop } from '@/components/home/FlowBackdrop';
import { HowItWorks } from '@/components/home/HowItWorks';
import { MapSection } from '@/components/home/MapSection';
import { TrustedSection } from '@/components/home/TrustedSection';

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
      <FeaturedProducts />
      <HowItWorks />
      <MapSection />
      <CustomersSection />
      <CtaSection />
    </>
  );
}
