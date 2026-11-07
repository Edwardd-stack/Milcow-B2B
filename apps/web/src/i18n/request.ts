import * as rootParams from 'next/root-params';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

/**
 * Runs on the server for every request: decides the locale
 * and loads the matching translation file from /messages.
 */
export default getRequestConfig(async ({ locale }) => {
  if (!locale) {
    // Read the [locale] segment of the URL (e.g. "ko" in /ko/products)
    const paramValue = await rootParams.locale();
    if (hasLocale(routing.locales, paramValue)) {
      locale = paramValue;
    } else {
      notFound();
    }
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
