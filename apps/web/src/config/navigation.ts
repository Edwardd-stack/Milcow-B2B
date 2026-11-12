/**
 * Main menu — one list used by the desktop header, the mobile menu and the footer.
 * `key` is the translation key in messages/*.json → "Nav".
 * `membersOnly`: shown only after login (header), never in the footer.
 */
export const MAIN_NAV = [
  { key: 'home', href: '/' },
  { key: 'products', href: '/products' },
  { key: 'map', href: '/map' },
  { key: 'contracts', href: '/contracts' },
  { key: 'orders', href: '/orders', membersOnly: true },
  { key: 'contact', href: '/contact' },
] as const satisfies readonly { key: string; href: string; membersOnly?: boolean }[];

/** Account dropdown (company name in the header) */
export const ACCOUNT_NAV = [
  { key: 'profile', href: '/profile' },
  { key: 'orders', href: '/orders' },
  { key: 'myContracts', href: '/contracts#my-contracts' },
] as const;

/** Items a visitor sees: members-only ones are left out for guests */
export const visibleNav = (loggedIn: boolean) =>
  MAIN_NAV.filter((item) => loggedIn || !('membersOnly' in item));

export type MainNavKey = (typeof MAIN_NAV)[number]['key'];

/** Contact details shown in the footer (demo values) */
export const COMPANY_CONTACT = {
  phone: '010-6573-1333',
  email: 'sardor.seniorr@gmail.com',
} as const;
