import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],

    reporters: ['verbose'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      clean: false,
      cleanOnRerun: false,
      include: ['src/app/**/*.ts'],
      exclude: ['src/app/**/*.spec.ts'],
      skipFull: false,
    },
  },
});
