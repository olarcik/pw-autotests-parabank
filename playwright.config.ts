// First import: setup.ts loads .env and env/<ENV>.env, so everything below sees those values.
import { BASE_URL } from './src/common/data/setup';
import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './src/tests',
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry locally too: ParaBank sometimes falsely answers "username already exists" on registration (see Known issues in CLAUDE.md) */
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    /* Qase TestOps — enabled with QASE_MODE=testops. Other QASE_* variables (run title, plan ID, etc.) are read by the reporter directly. */
    [
      'playwright-qase-reporter',
      {
        mode: process.env.QASE_MODE || 'off',
        testops: {
          api: {
            token: process.env.QASE_TESTOPS_API_TOKEN,
          },
          project: process.env.QASE_TESTOPS_PROJECT,
          uploadAttachments: true,
        },
        framework: {
          /* Adds the Playwright project name (chromium, firefox, webkit or api) as the Qase parameter "Project" */
          browser: {
            addAsParameter: true,
            parameterName: 'Project',
          },
          markAsFlaky: true,
        },
      },
    ],
  ],
  use: {
    baseURL: BASE_URL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: 'api/**',
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: 'api/**',
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: 'api/**',
    },

    /* API tests: plain HTTP through the `request` fixture, run once and without a browser */
    {
      name: 'api',
      testMatch: 'api/**/*.spec.ts',
    },
  ],
});
