import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: ['./src/lib/db/schema.ts', './src/lib/db/video-schema.ts'],
  out: './drizzle/migrations',
});
