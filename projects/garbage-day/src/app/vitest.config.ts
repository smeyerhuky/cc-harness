import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'app',
    environment: 'happy-dom',
    include: ['client/**/*.test.tsx'],
    setupFiles: ['./test/setup.ts'],
  },
});
