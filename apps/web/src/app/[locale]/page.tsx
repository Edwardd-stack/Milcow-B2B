import { AboutSection } from '@/components/home/AboutSection';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { Hero } from '@/components/home/Hero';
import { TrustedSection } from '@/components/home/TrustedSection';

/** Home — sections are added one by one, in the template's order */
export default function HomePage() {
  return (
    <>
      <Hero />
      <AboutSection />
      <TrustedSection />
      <FeaturedProducts />
    </>
  );
}
