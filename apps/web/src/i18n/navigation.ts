import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

/**
 * Locale-aware versions of Next.js navigation helpers.
 * Use these instead of `next/link` / `next/navigation` so the current
 * language prefix (/ko, /en, /uz) is kept automatically.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
