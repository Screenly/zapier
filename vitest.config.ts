import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    reporters: ['verbose'],
    environment: 'node',
    testTimeout: 10000,
    include: ['test/*.test.ts'],
    exclude: ['node_modules/', 'test/index.visual.test.ts'],
    coverage: {
      enabled: true,
      provider: 'v8',
      include: ['**/*.ts'],
      exclude: ['vitest.config.ts', 'vitest.visual.config.ts', 'test/setup.visual.ts'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
});
