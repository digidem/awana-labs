import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for live site testing
 * Tests run against the deployed GitHub Pages site
 */
export default defineConfig({
  testDir: "./",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 0 : 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  outputDir: "./test-results",
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
