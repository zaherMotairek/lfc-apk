import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';
const desktopChrome = {
  ...devices['Desktop Chrome'],
  viewport: { width: 1440, height: 900 },
};
const authSpecIgnore = [/auth\.setup\.ts/, /smoke-admin\.spec/, /smoke-member\.spec/];

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'mobile',
      testIgnore: authSpecIgnore,
      use: {
        ...devices['Pixel 5'],
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: 'desktop',
      testIgnore: authSpecIgnore,
      use: desktopChrome,
    },
    {
      name: 'desktop-admin',
      testMatch: /smoke-admin\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...desktopChrome,
        storageState: 'e2e/.auth/admin.json',
      },
    },
    {
      name: 'desktop-member',
      testMatch: /smoke-member\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...desktopChrome,
        storageState: 'e2e/.auth/member.json',
      },
    },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : [
        {
          command: 'npm run dev:api',
          url: 'http://127.0.0.1:3000/api/health',
          reuseExistingServer: !process.env.CI,
          timeout: 300_000,
        },
        {
          command: 'npm run dev -w @kop/web',
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 300_000,
        },
      ],
});
