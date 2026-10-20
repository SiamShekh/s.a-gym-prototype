import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    setupFiles: ['./tests/setup.js'],
    fileParallelism: false,
    hookTimeout: 60000,
    testTimeout: 30000,
  },
});
