import { Suspense } from 'react';
import { ProductDetailView } from '@/components/products/detail/ProductDetailView';

/**
 * No generateMetadata here: the [id] segment is only known per request, and reading params
 * for metadata would block prerendering of the whole route. The view sets document.title itself
 * — with the product's real name.
 */
export default function ProductDetailPage() {
  return (
    // The view reads the id from the URL (useParams) → needs a Suspense boundary
    <Suspense fallback={<div className="h-[800px]" />}>
      <ProductDetailView />
    </Suspense>
  );
}
