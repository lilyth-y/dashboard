import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: 'html',
    timeout: 60000,
    use: {
    baseURL: 'http://127.0.0.1:3051',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Disabled firefox/webkit due to webkit auth session issues and CI runs Chromium only
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  webServer: {
    command: 'cmd /c pnpm start -p 3051',
    url: 'http://127.0.0.1:3051',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      NEXTAUTH_URL: 'http://127.0.0.1:3051',
      NEXTAUTH_SECRET: 'e2e-test-secret',
      NODE_ENV: 'production'
    }
  },
});
