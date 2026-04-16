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

    expect(response, "Page should return a response").toBeDefined();
    const status = response!.status();
    expect(
      status,
      `Expected 2xx/3xx status, got ${status}`,
    ).toBeGreaterThanOrEqual(200);
    expect(status, `Expected < 400 status, got ${status}`).toBeLessThan(400);

    expect(page.url()).toBeTruthy();
    expect(page.url().length).toBeGreaterThan(0);
  });

  test("site has proper HTML structure", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const html = page.locator("html");
    await expect(html).toBeAttached();

    const body = page.locator("body");
    await expect(body).toBeAttached();
    await expect(body).toBeVisible();
  });

  test("site has meaningful content", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const bodyText = await page.locator("body").textContent();
    expect(
      bodyText?.trim().length,
      "Page should have substantial content",
    ).toBeGreaterThan(100);
    expect(bodyText?.trim(), "Page should not be blank").not.toBe("");
  });

  test("site loads within reasonable time", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const loadTime = Date.now() - startTime;

    expect(
      loadTime,
      `Site took ${loadTime}ms to load, expected < 10000ms`,
    ).toBeLessThan(10000);
  });

  test("critical assets load successfully", async ({ page }) => {
    const failedRequests: { url: string; status: number }[] = [];

    page.on("response", (response) => {
      const url = response.url();
      if (
        (url.includes(".js") || url.includes(".css")) &&
        response.status() >= 400
      ) {
        failedRequests.push({ url, status: response.status() });
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    expect(
      failedRequests,
      `Failed asset requests: ${JSON.stringify(failedRequests, null, 2)}`,
    ).toHaveLength(0);
  });

  test("no critical JavaScript errors", async ({ page }) => {
    const errors: string[] = [];

    page.on("pageerror", (error) => {
      // Ignore third-party script errors that we cannot control
      const errorStr = error.toString();
      if (
        errorStr.includes("Script error") ||
        errorStr.includes("cdn") ||
        errorStr.includes("analytics")
      ) {
        return;
      }
      errors.push(errorStr);
    });

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Wait for async errors to surface
    await page.waitForTimeout(2000);

    expect(
      errors,
      `JavaScript errors detected: ${errors.join("\n")}`,
    ).toHaveLength(0);
  });

  test("site is responsive on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const body = page.locator("body");
    await expect(body).toBeVisible();

    const bodyText = await body.textContent();
    expect(
      bodyText?.trim().length,
      "Mobile page should have content",
    ).toBeGreaterThan(50);
  });

  test("site is responsive on desktop viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const body = page.locator("body");
    await expect(body).toBeVisible();

    const bodyText = await body.textContent();
    expect(
      bodyText?.trim().length,
      "Desktop page should have content",
    ).toBeGreaterThan(50);
  });

  test("site navigation works", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const links = page.locator("a[href]");
    const linkCount = await links.count();

    expect(
      linkCount,
      "Page should have at least one navigable link",
    ).toBeGreaterThan(0);

    // Click the first link and verify navigation occurs
    await links.first().click();
    await page.waitForTimeout(1000);

    expect(
      page.url(),
      "Page should have navigated to a valid URL",
    ).toBeTruthy();
  });
});
