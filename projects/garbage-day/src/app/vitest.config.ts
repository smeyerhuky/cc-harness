import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'app',
    environment: 'happy-dom',
    include: ['client/**/*.test.{ts,tsx}', 'test/**/*.test.ts'],
    setupFiles: ['./test/setup.ts'],
  },
});
