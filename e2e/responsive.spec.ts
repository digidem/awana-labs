import { test, expect, type Page } from "@playwright/test";

const BREAKPOINTS = {
  mobile: { width: 375, height: 667, name: "Mobile (iPhone SE)" },
  tablet: { width: 768, height: 1024, name: "Tablet (iPad)" },
  desktop: { width: 1920, height: 1080, name: "Desktop (1080p)" },
  ultra: { width: 2560, height: 1440, name: "Ultra-wide (1440p)" },
};

const runtimeProjectsCacheEntry = {
  version: 2,
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
          images: [
            "https://images.unsplash.com/photo-2",
            "https://images.unsplash.com/photo-3",
          ],
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

const pinAppLanguage = async (page: Page) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("awana-labs-language", "en");
    window.localStorage.setItem("i18nextLng", "en");
  });
};

const seedRuntimeCache = async (page: Page) => {
  await page.addInitScript((cacheEntry) => {
    window.localStorage.setItem(
      "awana-labs-projects-cache",
      JSON.stringify(cacheEntry),
    );
  }, runtimeProjectsCacheEntry);
};

test.describe("Responsive Design", () => {
  Object.entries(BREAKPOINTS).forEach(([key, { width, height, name }]) => {
    test.describe(`${name} - ${width}x${height}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width, height });
        await pinAppLanguage(page);
        await seedRuntimeCache(page);
        await page.goto("/");
        await page.waitForLoadState("networkidle");
      });

      test("renders the header with the shipped controls", async ({ page }) => {
        const header = page.locator("header");
        await expect(header).toBeVisible();
        await expect(
          header.getByLabel("Visit GitHub repository"),
        ).toBeVisible();
        await expect(header.getByRole("combobox")).toHaveCount(0);
        await expect(header.locator('[aria-label*="menu" i]')).toHaveCount(0);
      });

      test("renders the hero content without horizontal overflow", async ({
        page,
      }) => {
        const hero = page.locator("#hero");
        await expect(hero).toBeVisible();
        await expect(hero.getByRole("heading", { level: 1 })).toBeVisible();
        await expect(
          hero.getByRole("button", { name: "Explore Projects" }),
        ).toBeVisible();

        const heroTitle = hero.getByRole("heading", { level: 1 });
        const titleBox = await heroTitle.boundingBox();
        expect(titleBox).not.toBeNull();
        if (titleBox) {
          expect(titleBox.width).toBeLessThanOrEqual(width);
        }
      });

      test("renders the projects section with stable controls", async ({
        page,
      }) => {
        const projectsSection = page.locator("#projects");
        await expect(projectsSection).toBeVisible();
        await expect(projectsSection.getByRole("textbox")).toBeVisible();
        await expect(
          projectsSection.getByRole("button", { name: "All" }),
        ).toBeVisible();
        await expect(
          projectsSection.getByRole("button", {
            name: /view details for CoMapeo Config Spreadsheet Plugin/i,
          }),
        ).toBeVisible();
      });

      test("opens and closes the project modal with accessible controls", async ({
        page,
      }) => {
        const projectCard = page.getByRole("button", {
          name: /view details for CoMapeo Config Spreadsheet Plugin/i,
        });
        await projectCard.click();

        const modal = page.getByRole("dialog");
        await expect(modal).toBeVisible();
        await expect(
          modal.getByRole("heading", {
            name: "CoMapeo Config Spreadsheet Plugin",
          }),
        ).toBeVisible();

        const closeButton = modal.getByRole("button", { name: "Close modal" });
        await expect(closeButton).toBeVisible();

        const modalBox = await modal.boundingBox();
        expect(modalBox).not.toBeNull();
        if (modalBox) {
          expect(modalBox.width).toBeLessThanOrEqual(width);
          expect(modalBox.height).toBeLessThanOrEqual(height);
        }

        await closeButton.click();
        await expect(modal).not.toBeVisible();
      });

      test("avoids horizontal scrolling", async ({ page }) => {
        const bodyScrollWidth = await page.evaluate(
          () => document.body.scrollWidth,
        );
        expect(bodyScrollWidth).toBeLessThanOrEqual(width + 20);
      });
    });
  });
});
