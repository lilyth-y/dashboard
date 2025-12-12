import { defineConfig } from 'vitest/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'

// ESM equivalent of __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url))

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
    // Add jest-dom types for better TypeScript support
    typecheck: {
      enabled: false,
    },
    coverage: {
      provider: 'istanbul',
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
