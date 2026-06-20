import { defineConfig } from 'vitest/config';

// Base (unit) config. The default `npm test` run is unit-only: emulator tests
// use the `*.emulator.test.ts` suffix and are excluded here, then run via their
// own config (`vitest.emulator.config.ts`) under `firebase emulators:exec`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules/**', 'dist/**', 'tests/**/*.emulator.test.ts'],
    setupFiles: ['tests/setup.ts'],
  },
});
