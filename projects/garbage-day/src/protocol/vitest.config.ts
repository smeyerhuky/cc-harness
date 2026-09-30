import { defineProject } from 'vitest/config';

export default defineProject({
  test: { name: 'protocol', environment: 'node', include: ['src/**/*.test.ts'] },
});
