import { defineConfig } from 'vitest/config'
import path from 'node:path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    css: false,
    globals: true,
    exclude: ['**/node_modules/**', '**/e2e/**', '**/.next/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        '.next/**',
        'e2e/**',
        '**/*.config.*',
        '**/*.setup.*',
        '**/__tests__/**',
        '**/types/**',
        'prisma/**',
      ],
      thresholds: {
        statements: 10,
        branches: 45,
        functions: 10,
        lines: 10,
      },
    },
  },
})
