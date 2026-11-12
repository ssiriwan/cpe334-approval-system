import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // All projects share one PostgreSQL database, so files must not run
    // concurrently or global count assertions race with other suites.
    fileParallelism: false,
    projects: [
      './client/vitest.config.ts',
      './server/vitest.config.ts',
      './tests/vitest.config.ts'
    ]
  }
});
