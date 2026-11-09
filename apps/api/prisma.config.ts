import 'dotenv/config'; // Prisma 7 does not read .env by itself
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  // A folder: every *.prisma file inside is one part of the schema
  schema: 'prisma/schema',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed/index.ts', // run with: prisma db seed
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
