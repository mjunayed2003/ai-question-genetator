import { defineConfig, env } from 'prisma/config';

try {
  process.loadEnvFile();
} catch {}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL || env('DATABASE_URL'),
  },
});
