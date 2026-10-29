import { defineConfig, devices } from '@playwright/test';
import { env } from './tests/config/env';

const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './tests',
  globalSetup: './tests/global-setup.ts',
  fullyParallel: false, // every test owns its data, so files AND tests may run in parallel
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 500_000 },
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: env.baseUrl,
    actionTimeout: 10_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'api', testMatch: '**/api/**/*.spec.ts' }, // no browser is launched for these
    { name: 'chromium', testMatch: '**/ui/**/*.spec.ts', testIgnore: '**/ui/responsive/**', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', testMatch: '**/ui/responsive/**/*.spec.ts', use: { ...devices['Pixel 7'] } },
    ...(process.env.CROSS_BROWSER
      ? [
          { name: 'firefox-smoke', testMatch: '**/ui/**/*.spec.ts', testIgnore: '**/ui/responsive/**', grep: /@smoke/, use: { ...devices['Desktop Firefox'] } },
          { name: 'webkit-smoke', testMatch: '**/ui/**/*.spec.ts', testIgnore: '**/ui/responsive/**', grep: /@smoke/, use: { ...devices['Desktop Safari'] } },
        ]
      : []),
  ],
  webServer: process.env.SKIP_WEB_SERVER
    ? undefined
    : { command: isCI ? 'npm run start' : 'npm run dev', url: env.baseUrl, reuseExistingServer: !isCI, timeout: 120_000 },
});
