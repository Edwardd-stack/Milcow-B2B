import { AboutSection } from '@/components/home/AboutSection';
import { AiSection } from '@/components/home/AiSection';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { Hero } from '@/components/home/Hero';
import { HowItWorks } from '@/components/home/HowItWorks';
import { MapSection } from '@/components/home/MapSection';
import { TrustedSection } from '@/components/home/TrustedSection';

/** Home — sections are added one by one, in the template's order */
export default function HomePage() {
  return (
    <>
      <Hero />
      <AboutSection />
      <TrustedSection />
      <FeaturedProducts />
      <HowItWorks />
      <AiSection />
      <MapSection />
    </>
  );
}
