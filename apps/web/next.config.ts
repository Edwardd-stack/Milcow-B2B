import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// Connects next-intl: finds src/i18n/request.ts automatically
const withNextIntl = createNextIntlPlugin();

// Where the NestJS API runs. Server-only (no NEXT_PUBLIC_) — the browser never talks to it directly.
const API_ORIGIN = process.env.API_ORIGIN ?? 'http://localhost:3000';

const nextConfig: NextConfig = {
  // Proxy: the browser calls /api/v1/... on OUR origin (3001), Next forwards it to the API (3000).
  // Same origin → the httpOnly auth cookie is first-party and no CORS is needed.
  async rewrites() {
    return [{ source: '/api/v1/:path*', destination: `${API_ORIGIN}/api/v1/:path*` }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default withNextIntl(nextConfig);
