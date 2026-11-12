import { Suspense } from 'react';
import { PassportView } from '@/components/passport/PassportView';

/**
 * No generateMetadata here: reading the dynamic [code] there would block prefetching (Next 16).
 * The tab title is set in PassportView (document.title), like the product detail page.
 */
export default function LotPassportPage() {
  // useParams() inside → needs a Suspense boundary
  return (
    <Suspense fallback={<div className="h-[900px]" />}>
      <PassportView />
    </Suspense>
  );
}
