import { defineRouting } from 'next-intl/routing';
import { DEFAULT_LOCALE, LOCALES } from '@milcow/shared';

/**
 * Which languages the site supports and how URLs look.
 * Locales come from packages/shared — the same list the API uses.
 *   /ko/products   /en/products   /uz/products
 */
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
});
