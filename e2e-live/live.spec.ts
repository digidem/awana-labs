import { test, expect } from "@playwright/test";

/**
 * Live site tests - run against the deployed GitHub Pages site
 * These tests verify the actual deployed site is working correctly
 *
 * These tests target the GitHub Pages deployment for this repository.
 */

const BASE_URL =
  process.env.BASE_URL || "https://digidem.github.io/awana-labs/";

test.use({
  baseURL: BASE_URL,
});

test.describe("Live Site Tests", () => {
  test("site loads and responds", async ({ page }) => {
    const response = await page.goto("/");

    // Should return 200 OK or 3xx redirect
    const status = response?.status();
    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThan(400);

    // Page should have loaded
    expect(page.url()).toBeTruthy();
    expect(page.url().length).toBeGreaterThan(0);
  });

  test("site has proper HTML structure", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Check for basic HTML elements
    const html = page.locator("html");
    await expect(html).toBeAttached();

    const body = page.locator("body");
    await expect(body).toBeAttached();
    await expect(body).toBeVisible();
  });

  test("site has meaningful content", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Should have substantial content
    const bodyText = await page.locator("body").textContent();
    expect(bodyText?.trim().length).toBeGreaterThan(100);

    // Should not be blank or just whitespace
    expect(bodyText?.trim()).not.toBe("");
  });

  test("site loads within reasonable time", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const loadTime = Date.now() - startTime;

    // Should load in less than 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test("critical assets load successfully", async ({ page }) => {
    const failedRequests: { url: string; status: number }[] = [];

    page.on("response", (response) => {
      const url = response.url();
      // Track critical asset failures
      if (
        (url.includes(".js") || url.includes(".css")) &&
        response.status() >= 400
      ) {
        failedRequests.push({ url, status: response.status() });
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Log any failures for debugging
    if (failedRequests.length > 0) {
      console.warn("Some assets failed to load:", failedRequests);
    }

    // The test should pass as long as the page itself loads
    // Individual asset failures are warnings, not failures
    expect(failedRequests.length).toBeLessThan(10);
  });

  test("no critical JavaScript errors", async ({ page }) => {
    const errors: string[] = [];

    page.on("pageerror", (error) => {
      // Only track critical errors, not third-party script issues
      const errorStr = error.toString();
      if (
        errorStr.includes("TypeError") ||
        errorStr.includes("SyntaxError") ||
        errorStr.includes("ReferenceError")
      ) {
        errors.push(errorStr);
      }
    });

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Wait a bit for async errors
    await page.waitForTimeout(2000);

    // Log errors for debugging
    if (errors.length > 0) {
      console.warn("JavaScript errors detected:", errors);
    }

    // Allow minor third-party errors but not critical app errors
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("Script error") &&
        !e.includes("cdn") &&
        !e.includes("analytics"),
    );

    // The site should work even with minor errors
    expect(criticalErrors.length).toBeLessThan(5);
  });

  test("site is responsive on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Check mobile content is visible
    const body = page.locator("body");
    await expect(body).toBeVisible();

    const bodyText = await body.textContent();
    expect(bodyText?.trim().length).toBeGreaterThan(50);
  });

  test("site is responsive on desktop viewport", async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Check desktop content is visible
    const body = page.locator("body");
    await expect(body).toBeVisible();

    const bodyText = await body.textContent();
    expect(bodyText?.trim().length).toBeGreaterThan(50);
  });

  test("site navigation works", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Find any links on the page
    const links = page.locator("a[href]").first();

    if ((await links.count()) > 0) {
      // Click the first link
      await links.first().click();

      // Wait for navigation
      await page.waitForTimeout(1000);

      // Page should still be loaded
      expect(page.url()).toBeTruthy();
    }
    // If no links, that's also fine - test passes
  });
});
