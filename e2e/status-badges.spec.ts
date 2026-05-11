import { test, expect } from "@playwright/test";
import { pinAppLanguage, type Page } from "./fixtures";

/**
 * Abort GitHub API requests so the background refresh fails gracefully
 * without overwriting the seeded multi-status cache.
 */
async function blockGitHubAPI(page: Page) {
  await page.route("https://api.github.com/**", (route) => route.abort());
}

/**
 * Helper: seed multiple projects with different statuses
 */
async function seedMultiStatusProjects(page: Page) {
  const projects = [
    {
      id: "active-project",
      issue_number: 1,
      title: "Active Project",
      slug: "active-project",
      description: "An active project for testing.",
      organization: {
        name: "Test Org",
        short_name: "Test",
        url: "https://example.com",
      },
      status: { state: "active", usage: "widely-used", notes: "" },
      tags: ["test"],
      media: { logo: "", images: [] },
      links: {
        homepage: "https://example.com/project",
        repository: "https://github.com/example/project",
        documentation: "https://docs.example.com/project",
      },
      timestamps: {
        created_at: "2024-01-01T00:00:00.000Z",
        last_updated_at: "2024-06-01T00:00:00.000Z",
      },
    },
    {
      id: "paused-project",
      issue_number: 2,
      title: "Paused Project",
      slug: "paused-project",
      description: "A paused project for testing.",
      organization: {
        name: "Test Org",
        short_name: "Test",
        url: "https://example.com",
      },
      status: { state: "paused", usage: "used", notes: "" },
      tags: ["test"],
      media: { logo: "", images: [] },
      links: {
        homepage: "https://example.com/project",
        repository: "https://github.com/example/project",
        documentation: "https://docs.example.com/project",
      },
      timestamps: {
        created_at: "2024-01-01T00:00:00.000Z",
        last_updated_at: "2024-03-01T00:00:00.000Z",
      },
    },
    {
      id: "archived-project",
      issue_number: 3,
      title: "Archived Project",
      slug: "archived-project",
      description: "An archived project for testing.",
      organization: {
        name: "Test Org",
        short_name: "Test",
        url: "https://example.com",
      },
      status: { state: "archived", usage: "experimental", notes: "" },
      tags: ["test"],
      media: { logo: "", images: [] },
      links: {
        homepage: "https://example.com/project",
        repository: "https://github.com/example/project",
        documentation: "https://docs.example.com/project",
      },
      timestamps: {
        created_at: "2023-01-01T00:00:00.000Z",
        last_updated_at: "2023-06-01T00:00:00.000Z",
      },
    },
  ];

  await page.addInitScript((data) => {
    window.localStorage.setItem(
      "awana-labs-projects-cache",
      JSON.stringify({
        version: 2,
        cachedAt: new Date().toISOString(),
        data: { projects: data },
      }),
    );
  }, projects);
}

test.describe("Status Badges", () => {
  test.beforeEach(async ({ page }) => {
    await pinAppLanguage(page);
  });

  test("renders active, paused, and archived badges with correct text", async ({
    page,
  }) => {
    await seedMultiStatusProjects(page);
    await blockGitHubAPI(page);
    await page.goto("/");
    await page.waitForSelector("#projects");

    // Verify badge text is visible (scoped to project cards to avoid filter button ambiguity)
    await expect(
      page
        .getByRole("button", { name: /view details for Active Project/i })
        .locator(".capitalize"),
    ).toContainText("Active");
    await expect(
      page
        .getByRole("button", { name: /view details for Paused Project/i })
        .locator(".capitalize"),
    ).toContainText("Paused");
    await expect(
      page
        .getByRole("button", { name: /view details for Archived Project/i })
        .locator(".capitalize"),
    ).toContainText("Archived");
  });

  test("active badge has solid-fill styling in light mode", async ({
    page,
  }) => {
    await seedMultiStatusProjects(page);
    await blockGitHubAPI(page);

    // Ensure light mode
    await page.addInitScript(() => {
      localStorage.setItem("awana-labs-theme", "light");
    });

    await page.goto("/");
    await page.waitForSelector("#projects");

    // Active badge should contain the status-active token
    const activeBadge = page
      .getByRole("button", { name: /view details for Active Project/i })
      .locator(".capitalize");

    await expect(activeBadge).toBeVisible();
    const activeClass = await activeBadge.getAttribute("class");
    expect(activeClass).toContain("--status-active");
    // Solid fill — no opacity modifier on bg
    expect(activeClass).not.toMatch(/bg-\[hsl\(var\(--status-active\)\)\]\/\d/);
  });

  test("paused badge has subtle-tint styling in light mode", async ({
    page,
  }) => {
    await seedMultiStatusProjects(page);
    await blockGitHubAPI(page);

    await page.addInitScript(() => {
      localStorage.setItem("awana-labs-theme", "light");
    });

    await page.goto("/");
    await page.waitForSelector("#projects");

    const pausedBadge = page
      .getByRole("button", { name: /view details for Paused Project/i })
      .locator(".capitalize");

    await expect(pausedBadge).toBeVisible();
    const pausedClass = await pausedBadge.getAttribute("class");
    expect(pausedClass).toContain("--status-paused");
    // Subtle tint — /15 opacity on bg
    expect(pausedClass).toContain("/15");
  });

  test("badges render correctly in dark mode", async ({ page }) => {
    await seedMultiStatusProjects(page);
    await blockGitHubAPI(page);

    // Set dark mode
    await page.addInitScript(() => {
      localStorage.setItem("awana-labs-theme", "dark");
    });

    await page.goto("/");
    await page.waitForSelector("#projects");

    // Verify dark class is present
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);

    // All badges should be visible (scoped to project cards to avoid filter button ambiguity)
    const activeBadge = page
      .getByRole("button", { name: /view details for Active Project/i })
      .locator(".capitalize");
    await expect(activeBadge).toBeVisible();

    const pausedBadge = page
      .getByRole("button", { name: /view details for Paused Project/i })
      .locator(".capitalize");
    await expect(pausedBadge).toBeVisible();

    const archivedBadge = page
      .getByRole("button", { name: /view details for Archived Project/i })
      .locator(".capitalize");
    await expect(archivedBadge).toBeVisible();

    // Verify badge elements have color-related classes (not empty/broken)
    const allBadges = [activeBadge, pausedBadge, archivedBadge];
    for (const badge of allBadges) {
      const cls = await badge.getAttribute("class");
      expect(cls).toBeTruthy();
      // Each badge should have some status-related styling
      expect(cls?.includes("--status-") || cls?.includes("muted")).toBeTruthy();
    }
  });
});
