import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    workers: 1,
    reporter: 'html',
    timeout: 60000,
    use: {
        baseURL: 'http://127.0.0.1:3051',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        actionTimeout: 15000,
        navigationTimeout: 30000,
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
