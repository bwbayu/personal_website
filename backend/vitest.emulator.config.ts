import { defineConfig } from 'vitest/config';

// Emulator config: runs ONLY the *.emulator.test.ts files (the inverse of the
// base unit run). Serial (fileParallelism: false) because the suites share the
// single demo-test database under the running Firestore emulator.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.emulator.test.ts'],
    exclude: ['node_modules/**', 'dist/**'],
    setupFiles: ['tests/setup.ts'],
    fileParallelism: false,
  },
});
