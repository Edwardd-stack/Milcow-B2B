'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from '@/i18n/navigation';

/**
 * New page → start at the very top, header included.
 *
 * Why: on navigation the App Router scrolls only to the top of the changed segment (<main>),
 * so the header — which lives in the layout, above <main> — is left above the screen.
 *
 * Not reset:
 *  - same page, only ?query changed (filters, tabs, pages) — the pathname stays the same;
 *  - language switch — next-intl's pathname has no locale prefix, so it stays the same too;
 *  - a link with #hash (/contracts#my-contracts) — the browser should jump to that block;
 *  - Back / Forward — the browser restores where the user was.
 */
export function ScrollReset() {
  const pathname = usePathname();
  const first = useRef(true);
  const fromHistory = useRef(false);

  useEffect(() => {
    const onPop = () => (fromHistory.current = true);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false; // the first load is handled by the browser
      return;
    }
    if (fromHistory.current) {
      fromHistory.current = false;
      return;
    }
    if (window.location.hash) return;
    // 'instant': <html> has scroll-smooth, and a smooth scroll here would look like a jump
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
