import { test, expect } from "@playwright/test";
import {
  seedProjectsCache,
  createCacheEntry,
  setNavigatorOffline,
  mockGitHubProjects,
} from "./fixtures";

test.describe("Projects runtime contract", () => {
  test("renders projects from the runtime cache contract", async ({ page }) => {
    await seedProjectsCache(page);

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("button", {
        name: /view details for CoMapeo Config Spreadsheet Plugin/i,
      }),
    ).toBeVisible();
    await expect(page.locator("#projects")).toContainText(
      "Google Sheets plugin for CoMapeo configurations.",
    );
  });

  test("fetches projects from GitHub on cold start and caches the result", async ({
    page,
  }) => {
    await mockGitHubProjects(page);

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("button", {
        name: /view details for CoMapeo Config Spreadsheet Plugin/i,
      }),
    ).toBeVisible();

    const cacheEntry = await page.evaluate(() =>
      JSON.parse(
        window.localStorage.getItem("awana-labs-projects-cache") ?? "null",
      ),
    );

    expect(cacheEntry?.version).toBe(2);
    expect(cacheEntry?.data?.projects?.[0]?.title).toBe(
      "CoMapeo Config Spreadsheet Plugin",
    );
  });

  test("rejects invalid cached payloads and refreshes from GitHub", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "awana-labs-projects-cache",
        JSON.stringify({
          version: 2,
          cachedAt: "2026-03-25T00:00:00.000Z",
          data: { projects: [{ id: "broken-project" }] },
        }),
      );
    });
    await mockGitHubProjects(page);

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("button", {
        name: /view details for CoMapeo Config Spreadsheet Plugin/i,
      }),
    ).toBeVisible();

    const cacheEntry = await page.evaluate(() =>
      JSON.parse(
        window.localStorage.getItem("awana-labs-projects-cache") ?? "null",
      ),
    );

    expect(cacheEntry?.data?.projects?.[0]?.slug).toBe(
      "comapeo-config-spreadsheet-plugin",
    );
  });

  test("falls back to cached projects while offline", async ({ page }) => {
    await seedProjectsCache(page, createCacheEntry(true));
    await setNavigatorOffline(page);

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("button", {
        name: /view details for CoMapeo Config Spreadsheet Plugin/i,
      }),
    ).toBeVisible();
    await expect(page.locator("#projects")).toContainText(
      "Google Sheets plugin for CoMapeo configurations.",
    );
  });
});
