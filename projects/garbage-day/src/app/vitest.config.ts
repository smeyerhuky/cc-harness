import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'app',
    environment: 'happy-dom',
    include: ['client/**/*.test.{ts,tsx}', 'test/**/*.test.ts'],
    // The accessibility scan runs in a real browser: vitest.browser.config.ts.
    exclude: ['client/**/*.browser.test.tsx'],
    setupFiles: ['./test/setup.ts'],
  },
});
