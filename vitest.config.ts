import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    coverage: { reporter: ['text', 'json'], lines: 80 },
    include: ['tests/**/*.test.ts'],
  },
});
