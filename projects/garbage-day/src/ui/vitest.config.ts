import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'ui',
    environment: 'happy-dom',
    include: ['src/**/*.test.tsx'],
    setupFiles: ['./test/setup.ts'],
  },
});
