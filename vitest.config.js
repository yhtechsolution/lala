import { defineConfig } from 'vitest/config';

// Only run the rules tests. Without this, vitest would also pick up the
// web/ app's own tests when run from the repository root.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
