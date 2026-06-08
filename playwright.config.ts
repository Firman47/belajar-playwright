import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Playwright Test Configuration
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter configuration
   * HTML Reporter: Interactive report with screenshots, videos, traces
   * JSON Reporter: Machine-readable results for CI integration
   * JUnit Reporter: Standard XML format for CI/CD pipelines
   */
  reporter: [
    ["html", { 
      open: "never", 
      outputFolder: "playwright-report" 
    }],
    ["json", { outputFile: "test-results/results.json" }],
    ["junit", { outputFile: "test-results/results.xml" }],
  ],

  /* Shared settings for all projects */
  use: {
    /* Base URL for tests - uncomment and set if needed */
    // baseURL: 'http://localhost:3000',

    /* Capture screenshot on failure only - reduces storage */
    screenshot: "only-on-failure",
    /* Record video only for failed tests */
    video: "retain-on-failure",
    /* Capture trace on first retry - helps debug flaky tests */
    trace: "on-first-retry",
    /* Set test timeout (default 30s) */
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  /* Output directories for artifacts */
  outputDir: "test-results/",

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  /* Test metadata for better reporting */
  metadata: {
    description: "E-Commerce Authentication Tests",
  },

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});