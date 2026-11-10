import { AboutSection } from '@/components/home/AboutSection';
import { Hero } from '@/components/home/Hero';

/** Home — sections are added one by one, in the template's order */
export default function HomePage() {
  return (
    <>
      <Hero />
      <AboutSection />
    </>
  );
}
