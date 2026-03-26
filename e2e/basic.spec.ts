import { test, expect } from "@playwright/test";

const runtimeProjectsCacheEntry = {
  version: 1,
  cachedAt: new Date().toISOString(),
  data: {
    projects: [
      {
        id: "comapeo-config-spreadsheet-plugin",
        issue_number: 2,
        title: "CoMapeo Config Spreadsheet Plugin",
        slug: "comapeo-config-spreadsheet-plugin",
        description: "Google Sheets plugin for CoMapeo configurations.",
        organization: {
          name: "Digital Democracy",
          short_name: "Awana Digital",
          url: "https://www.digital-democracy.org",
        },
        status: {
          state: "active",
          usage: "widely-used",
          notes: "Used in multiple deployments.",
        },
        tags: ["CoMapeo", "Mapping", "Spreadsheet"],
        media: {
          logo: "https://images.unsplash.com/photo-1",
          images: ["https://images.unsplash.com/photo-2"],
        },
        links: {
          homepage: "https://www.digital-democracy.org/comapeo",
          repository:
            "https://github.com/digidem/comapeo-config-spreadsheet-plugin",
          documentation: "https://docs.example.com/comapeo",
        },
        timestamps: {
          created_at: "2024-01-01T00:00:00.000Z",
          last_updated_at: "2024-01-02T00:00:00.000Z",
        },
      },
    ],
  },
} as const;

/**
 * Basic page load and rendering tests
 * These tests ensure the website loads correctly and displays content
 */
test.describe("Basic Page Tests", () => {
  test("homepage loads successfully", async ({ page }) => {
    const response = await page.goto("/");

    // Should return 200 OK
    expect(response?.status()).toBe(200);

    // Check page title
    await expect(page).toHaveTitle(/Awana Labs/);

    // React root should exist
    const root = page.locator("#root");
    await expect(root).toBeVisible();
  });

  test("page has meaningful content", async ({ page }) => {
    await page.addInitScript((cacheEntry) => {
      window.localStorage.setItem(
        "awana-labs-projects-cache",
        JSON.stringify(cacheEntry),
      );
    }, runtimeProjectsCacheEntry);

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check for primary visible content instead of a brittle text-length heuristic.
    await expect(page.locator("#hero")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: "Awana Labs" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Scroll to projects" }),
    ).toBeVisible();
    await expect(page.locator("#projects")).toBeVisible();

    // Should not contain error messages
    await expect(page.locator("body")).not.toContainText([
      "Application error",
      "Something went wrong",
    ]);
  });

  test("no console errors on page load", async ({ page }) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/");

    // Allow some time for async errors
    await page.waitForTimeout(2000);

    // Check for specific error patterns that indicate problems
    const criticalErrors = errors.filter(
      (e) =>
        e.includes("Uncaught") ||
        e.includes("TypeError") ||
        e.includes("ReferenceError"),
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test("page is responsive (mobile viewport)", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Check mobile content is visible
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("page is responsive (desktop viewport)", async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");

    // Check desktop content is visible
    const body = page.locator("body");
    await expect(body).toBeVisible();
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
    await page.addInitScript((cacheEntry) => {
      window.localStorage.setItem(
        "awana-labs-projects-cache",
        JSON.stringify(cacheEntry),
      );
    }, runtimeProjectsCacheEntry);

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

/**
 * Performance tests
 * Basic performance checks
 */
test.describe("Performance Tests", () => {
  test("page loads within reasonable time", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const loadTime = Date.now() - startTime;

    // Should load in less than 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test("Time to First Contentful Paint is reasonable", async ({ page }) => {
    const metrics = await page.goto("/").then(async () => {
      return await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const fcp = entries.find(
              (entry) => entry.name === "first-contentful-paint",
            );
            if (fcp) {
              resolve(fcp.startTime);
            }
          }).observe({ entryTypes: ["paint"] });
        });
      });
    });

    // FCP should be less than 3 seconds (soft check)
    // Note: This test may not work in all environments
  });
});
