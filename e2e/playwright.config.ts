import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: path.join(__dirname, 'tests'),
  testMatch: ['**/*.spec.ts'],
  testIgnore: ['**/lib/**', '**/lib/tests/**', '**/lib/**/*.spec.ts'],
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // webServer: {
  //   command: 'npm run start',
  //   port: 4200,
  //   reuseExistingServer: true,
  //   timeout: 120_000,
  // },
});
