import { test, expect } from "@playwright/test";
import { pinAppLanguage, seedProjectsCache } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await pinAppLanguage(page);
  await seedProjectsCache(page);
});

test.describe("Basic Page Tests", () => {
  test("page loads successfully with content and no errors", async ({
    page,
  }) => {
    // Collect console errors before navigation
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    const startTime = Date.now();
    const response = await page.goto("/");
    await page.waitForSelector("#projects", {
      state: "visible",
      timeout: 10000,
    });
    const loadTime = Date.now() - startTime;

    // HTTP 200 status
    expect(response?.status()).toBe(200);

    // Page title contains "Awana Labs"
    await expect(page).toHaveTitle(/Awana Labs/);

    // React root is visible
    await expect(page.locator("#root")).toBeVisible();

    // Hero section with h1 heading is visible
    await expect(page.locator("#hero")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: "Awana Labs" }),
    ).toBeVisible();

    // Projects section is visible
    await expect(page.locator("#projects")).toBeVisible();

    // Body does not contain error messages
    await expect(page.locator("body")).not.toContainText([
      "Application error",
      "Something went wrong",
    ]);

    // No critical console errors
    const criticalErrors = errors.filter(
      (e) =>
        e.includes("Uncaught") ||
        e.includes("TypeError") ||
        e.includes("ReferenceError"),
    );
    expect(criticalErrors).toHaveLength(0);

    // Load time under 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });
});

/**
 * GitHub Pages SPA routing tests
 * These tests ensure HashRouter works correctly for client-side routing
 */
test.describe("GitHub Pages Routing Tests", () => {
  test("HashRouter handles routes correctly", async ({ page }) => {
    // Navigate to root with hash
    const response = await page.goto("/#/");

    // Should get 200 OK
    expect(response?.status()).toBe(200);

    // React root should be visible
    await expect(page.locator("#root")).toBeVisible();
  });

  test("HashRouter handles non-existent routes", async ({ page }) => {
    // Navigate to a non-existent route with hash
    const response = await page.goto(
      "/#/some-random-route-that-does-not-exist",
    );

    // Should get 200 OK because HashRouter handles it
    expect(response?.status()).toBe(200);

    // React Router should handle the route and show NotFound page
    await expect(page.locator("#root")).toBeVisible();
  });

  test("direct URL without hash loads homepage", async ({ page }) => {
    // Navigate without hash - should still load the app
    const response = await page.goto("/");

    // Should get 200 OK
    expect(response?.status()).toBe(200);

    // React root should be visible
    await expect(page.locator("#root")).toBeVisible();
  });
});

/**
 * Asset loading tests
 * Ensure all critical assets load correctly
 */
test.describe("Asset Loading Tests", () => {
  test("JavaScript bundle loads", async ({ page }) => {
    const jsRequests: string[] = [];

    page.on("request", (request) => {
      if (request.url().includes(".js")) {
        jsRequests.push(request.url());
      }
    });

    await page.goto("/");

    // At least one JS file should be requested
    expect(jsRequests.length).toBeGreaterThan(0);
  });

  test("CSS loads", async ({ page }) => {
    const cssRequests: string[] = [];

    page.on("request", (request) => {
      if (request.url().includes(".css")) {
        cssRequests.push(request.url());
      }
    });

    await page.goto("/");

    // At least one CSS file should be requested
    expect(cssRequests.length).toBeGreaterThan(0);
  });

  test("project data loads through the runtime cache contract", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("#projects")).toContainText(
      "CoMapeo Config Spreadsheet Plugin",
    );
  });
});

/**
 * Accessibility tests
 * Basic accessibility checks
 */
test.describe("Accessibility Tests", () => {
  test("page has proper meta tags", async ({ page }) => {
    await page.goto("/");

    // Check viewport meta tag
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute("content", /width=device-width/);

    // Check charset
    const charset = page.locator("meta[charset]");
    await expect(charset).toHaveAttribute("charset", "UTF-8");
  });

  test("page has proper language attribute", async ({ page }) => {
    await page.goto("/");

    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", /en/);
  });
});
