import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/test/*.visual.test.ts'],
    setupFiles: ['./test/setup.visual.ts'],
    testTimeout: 30000,
  },
});
