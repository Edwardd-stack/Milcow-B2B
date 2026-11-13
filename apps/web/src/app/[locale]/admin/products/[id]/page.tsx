import { Suspense } from 'react';
import { ProductEdit } from '@/components/admin/ProductEdit';

/** Title is set client-side in ProductEdit (reading [id] in generateMetadata blocks prefetching) */
// Rendered only after the client knows the role (AdminShell) → not prerenderable for instant nav
export const instant = false;

export default function Page() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-white" />}>
      <ProductEdit />
    </Suspense>
  );
}
