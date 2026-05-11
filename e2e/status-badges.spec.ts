import { test, expect } from "@playwright/test";
import {
  pinAppLanguage,
  seedProjectsCache,
  mockGitHubProjects,
  type Page,
} from "./fixtures";

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
      links: { homepage: "", repository: "", documentation: "" },
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
      links: { homepage: "", repository: "", documentation: "" },
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
      links: { homepage: "", repository: "", documentation: "" },
      timestamps: {
        created_at: "2023-01-01T00:00:00.000Z",
        last_updated_at: "2023-06-01T00:00:00.000Z",
      },
    },
  ];

  await page.addInitScript((data) => {
    window.localStorage.setItem(
      "awana-labs-projects-cache",
      JSON.stringify({ version: 2, cachedAt: new Date().toISOString(), data: { projects: data } }),
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
    await mockGitHubProjects(page);
    await page.goto("/");
    await page.waitForSelector("#projects");

    // Verify badge text is visible
    await expect(page.getByText("Active")).toBeVisible();
    await expect(page.getByText("Paused")).toBeVisible();
    await expect(page.getByText("Archived")).toBeVisible();
  });

  test("active badge has solid-fill styling in light mode", async ({
    page,
  }) => {
    await seedMultiStatusProjects(page);
    await mockGitHubProjects(page);

    // Ensure light mode
    await page.addInitScript(() => {
      localStorage.setItem("awana-labs-theme", "light");
    });

    await page.goto("/");
    await page.waitForSelector("#projects");

    // Active badge should contain the status-active token
    const activeBadge = page
      .locator("button")
      .filter({ hasText: "Active Project" })
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
    await mockGitHubProjects(page);

    await page.addInitScript(() => {
      localStorage.setItem("awana-labs-theme", "light");
    });

    await page.goto("/");
    await page.waitForSelector("#projects");

    const pausedBadge = page
      .locator("button")
      .filter({ hasText: "Paused Project" })
      .locator(".capitalize");

    await expect(pausedBadge).toBeVisible();
    const pausedClass = await pausedBadge.getAttribute("class");
    expect(pausedClass).toContain("--status-paused");
    // Subtle tint — /15 opacity on bg
    expect(pausedClass).toContain("/15");
  });

  test("badges render correctly in dark mode", async ({ page }) => {
    await seedMultiStatusProjects(page);
    await mockGitHubProjects(page);

    // Set dark mode
    await page.addInitScript(() => {
      localStorage.setItem("awana-labs-theme", "dark");
    });

    await page.goto("/");
    await page.waitForSelector("#projects");

    // Verify dark class is present
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);

    // All badges should be visible
    await expect(page.getByText("Active")).toBeVisible();
    await expect(page.getByText("Paused")).toBeVisible();
    await expect(page.getByText("Archived")).toBeVisible();

    // Verify badge elements have color-related classes (not empty/broken)
    const badges = page.locator(".capitalize");
    const count = await badges.count();
    expect(count).toBeGreaterThanOrEqual(3);

    for (let i = 0; i < count; i++) {
      const cls = await badges.nth(i).getAttribute("class");
      expect(cls).toBeTruthy();
      // Each badge should have some status-related styling
      expect(
        cls?.includes("--status-") || cls?.includes("muted"),
      ).toBeTruthy();
    }
  });
});
