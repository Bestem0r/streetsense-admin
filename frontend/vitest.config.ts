import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    exclude: [
      'src/app/esri-map/**', // ArcGIS imports CSS at ESM level — can't run in jsdom
      'src/app/arcgis-map/**', // same as above
    ],
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
