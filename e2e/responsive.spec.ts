import { test, expect } from "@playwright/test";
import {
  pinAppLanguage,
  seedProjectsCache,
} from "./fixtures";

const BREAKPOINTS = {
  mobile: { width: 375, height: 667, name: "Mobile (iPhone SE)" },
  tablet: { width: 768, height: 1024, name: "Tablet (iPad)" },
  desktop: { width: 1920, height: 1080, name: "Desktop (1080p)" },
  ultra: { width: 2560, height: 1440, name: "Ultra-wide (1440p)" },
};

test.describe("Responsive Design", () => {
  Object.entries(BREAKPOINTS).forEach(([key, { width, height, name }]) => {
    test.describe(`${name} - ${width}x${height}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width, height });
        await pinAppLanguage(page);
        await seedProjectsCache(page);
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
