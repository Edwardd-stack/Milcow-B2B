/**
 * Main menu — one list used by the desktop header, the mobile menu and the footer.
 * `key` is the translation key in messages/*.json → "Nav".
 */
export const MAIN_NAV = [
  { key: 'home', href: '/' },
  { key: 'products', href: '/products' },
  { key: 'map', href: '/map' },
  { key: 'contracts', href: '/contracts' },
  { key: 'about', href: '/about' },
  { key: 'contact', href: '/contact' },
] as const;

export type MainNavKey = (typeof MAIN_NAV)[number]['key'];

/** Contact details shown in the footer (demo values) */
export const COMPANY_CONTACT = {
  phone: '010-6573-1333',
  email: 'sardor.seniorr@gmail.com',
} as const;
