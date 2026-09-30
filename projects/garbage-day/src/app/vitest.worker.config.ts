import { cloudflareTest } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

// The Worker and Durable Object tests, run inside workerd (`pnpm test:worker`). Kept apart from
// vitest.config.ts, whose client tests run in happy-dom.
export default defineConfig({
  plugins: [cloudflareTest({ wrangler: { configPath: './wrangler.jsonc' } })],
  test: { name: 'worker', include: ['worker/**/*.test.ts'] },
});
