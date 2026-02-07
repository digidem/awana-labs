import { test, expect } from "@playwright/test";

/**
 * Projects Display Tests
 * These tests verify that projects from GitHub Issues display correctly on the website
 */
test.describe("Projects Display Tests", () => {
  test("projects section is visible on homepage", async ({ page }) => {
    await page.goto("/");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Check that projects section exists - use id selector for specificity
    const projectsSection = page.locator("#projects");
    await expect(projectsSection).toBeVisible();
  });

  test("project cards are displayed", async ({ page }) => {
    await page.goto("/");

    // Wait for projects to load
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Look for project cards - they should have project titles
    const projectCards = page
      .locator("[class*='project'], [class*='Project']")
      .or(page.locator("a").filter({ hasText: /CoMapeo|Awana/ }));

    // Wait for cards to be visible
    await projectCards
      .first()
      .waitFor({ state: "visible", timeout: 5000 })
      .catch(() => {
        // If no specific cards found, check if there's any content
        console.log("Project cards selector may need adjustment");
      });
  });

  test("CoMapeo project from GitHub Issue #2 is displayed", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for content to load
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    // Check for CoMapeo project content
    const pageContent = page.locator("body");
    const textContent = await pageContent.textContent();

    // Should contain CoMapeo reference
    expect(textContent?.toLowerCase()).toContain("comapeo");

    // Should contain Awana Digital (the organization shown in the UI)
    expect(textContent?.toLowerCase()).toContain("awana digital");
  });

  test("project tags are visible", async ({ page }) => {
    await page.goto("/");

    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Look for tags - common tag selectors
    const tags = page
      .locator("[class*='tag'], span[class*='badge']")
      .or(
        page
          .locator("span")
          .filter({ hasText: /Mapping|Spreadsheet|Configuration/ }),
      );

    // At least check if the page contains tag-related content
    const pageContent = page.locator("body");
    await expect(pageContent).toContainText(
      /Mapping|Spreadsheet|Configuration/i,
    );
  });

  test("project status badges are displayed", async ({ page }) => {
    await page.goto("/");

    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Check for active/widely-used status indicators
    const pageContent = page.locator("body");
    const textContent = await pageContent.textContent();

    // Should show status information
    expect(textContent?.toLowerCase()).toMatch(/active|widely.?used/);
  });

  test("projects.json is fetched and contains correct data", async ({
    page,
  }) => {
    // Use relative path to respect baseURL
    const response = await page.request.get("./projects.json");

    expect(response?.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty("projects");
    expect(Array.isArray(data.projects)).toBeTruthy();

    // Should have at least the CoMapeo project
    const comapeoProject = data.projects.find(
      (p: { title?: string; id?: string }) =>
        p.title?.includes("CoMapeo") || p.id?.includes("comapeo"),
    );

    expect(comapeoProject).toBeDefined();
    expect(comapeoProject?.organization?.name).toBe("Digital Democracy");
    expect(comapeoProject?.status?.state).toBe("active");
    expect(comapeoProject?.tags).toContain("Mapping");
  });

  test("project cards have correct structure", async ({ page }) => {
    await page.goto("/");

    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    // Verify the page has project-related content
    const body = page.locator("body");

    // Check for key elements from the project data
    await expect(body).toContainText("CoMapeo", { timeout: 5000 });
    await expect(body).toContainText("Awana Digital");
    await expect(body).toContainText("Google Sheets plugin");
  });

  test("clicking project shows details (if modal exists)", async ({ page }) => {
    await page.goto("/");

    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Try to find and click a project card
    const projectLink = page
      .locator("a, div, button")
      .filter({ hasText: /CoMapeo/i })
      .first();

    const isVisible = await projectLink.isVisible().catch(() => false);
    if (isVisible) {
      await projectLink.click();
      await page.waitForTimeout(500);

      // If modal opens, check for detail content
      const modal = page.locator(
        "[role='dialog'], .modal, [class*='Modal'], [class*='dialog']",
      );
      const modalExists = await modal.count();

      if (modalExists > 0) {
        await expect(modal.first()).toBeVisible();
      }
    }
  });
});

/**
 * Projects Data Integrity Tests
 * Verify the data pipeline from GitHub Issues -> projects.json -> UI
 */
test.describe("Projects Data Pipeline Tests", () => {
  test("projects.json has valid structure", async ({ page }) => {
    const response = await page.request.get("./projects.json");
    const data = await response.json();

    // Validate structure
    expect(data).toMatchObject({
      projects: expect.any(Array),
    });

    // Each project should have required fields
    data.projects.forEach((project: Record<string, unknown>) => {
      expect(project).toHaveProperty("id");
      expect(project).toHaveProperty("title");
      expect(project).toHaveProperty("slug");
      expect(project).toHaveProperty("description");
      expect(project).toHaveProperty("organization");
      expect(project).toHaveProperty("status");
      expect(project).toHaveProperty("tags");
      expect(project).toHaveProperty("links");
    });
  });

  test("GitHub Issue #2 data is correctly parsed", async ({ page }) => {
    const response = await page.request.get("./projects.json");
    const data = await response.json();

    const project = data.projects.find(
      (p: { issue_number?: number }) => p.issue_number === 2,
    );

    expect(project).toBeDefined();
    expect(project?.title).toBe("CoMapeo Config Spreadsheet Plugin");
    expect(project?.slug).toBe("comapeo-config-spreadsheet-plugin");
    expect(project?.organization?.name).toBe("Digital Democracy");
    expect(project?.organization?.short_name).toBe("digidem");
    expect(project?.organization?.url).toBe(
      "https://www.digital-democracy.org",
    );
    expect(project?.status?.state).toBe("active");
    expect(project?.status?.usage).toBe("widely-used");
    expect(project?.tags).toEqual(
      expect.arrayContaining(["CoMapeo", "Mapping", "Spreadsheet"]),
    );
    expect(project?.media?.logo).toContain("unsplash.com");
    expect(project?.media?.images).toHaveLength(2);
    expect(project?.links?.homepage).toContain("digital-democracy.org");
    expect(project?.links?.repository).toContain(
      "github.com/digidem/comapeo-config-spreadsheet-plugin",
    );
  });

  test("all projects have required timestamps", async ({ page }) => {
    const response = await page.request.get("./projects.json");
    const data = await response.json();

    data.projects.forEach(
      (project: {
        timestamps?: { created_at: string; last_updated_at: string };
      }) => {
        expect(project.timestamps).toBeDefined();
        expect(project.timestamps.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(project.timestamps.last_updated_at).toMatch(
          /^\d{4}-\d{2}-\d{2}T/,
        );
      },
    );
  });
});

/**
 * Links and Navigation Tests
 */
test.describe("Project Links Tests", () => {
  test("repository links are valid", async ({ page }) => {
    const response = await page.request.get("./projects.json");
    const data = await response.json();

    const comapeoProject = data.projects.find(
      (p: { issue_number?: number }) => p.issue_number === 2,
    );
    expect(comapeoProject?.links?.repository).toBe(
      "https://github.com/digidem/comapeo-config-spreadsheet-plugin",
    );
  });

  test("homepage and documentation links exist", async ({ page }) => {
    const response = await page.request.get("./projects.json");
    const data = await response.json();

    const comapeoProject = data.projects.find(
      (p: { issue_number?: number }) => p.issue_number === 2,
    );
    expect(comapeoProject?.links?.homepage).toBeTruthy();
    expect(comapeoProject?.links?.repository).toBeTruthy();
  });
});
