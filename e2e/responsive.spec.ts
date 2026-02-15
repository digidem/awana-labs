import { test, expect } from "@playwright/test";

const BREAKPOINTS = {
  mobile: { width: 375, height: 667, name: "Mobile (iPhone SE)" },
  tablet: { width: 768, height: 1024, name: "Tablet (iPad)" },
  desktop: { width: 1920, height: 1080, name: "Desktop (1080p)" },
  ultra: { width: 2560, height: 1440, name: "Ultra-wide (1440p)" },
};

test.describe("Responsive Design Tests", () => {
  Object.entries(BREAKPOINTS).forEach(([key, { width, height, name }]) => {
    test.describe(`${name} - ${width}x${height}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto("/");
      });

      test("should render header correctly", async ({ page }) => {
        const header = page.locator("header");
        await expect(header).toBeVisible();

        // Check that header items are accessible
        const languageSwitcher = header.locator('[role="combobox"]');
        await expect(languageSwitcher).toBeVisible();

        if (key === "mobile") {
          // Mobile menu button should be visible
          const menuButton = header.locator('[aria-label*="menu"]');
          await expect(menuButton).toBeVisible();
        }
      });

      test("should render hero section correctly", async ({ page }) => {
        const hero = page.locator("#hero");
        await expect(hero).toBeVisible();

        // Check hero text is visible
        const title = hero.locator("h1");
        await expect(title).toBeVisible();

        // Verify text doesn't overflow
        const titleBox = await title.boundingBox();
        expect(titleBox).not.toBeNull();
        if (titleBox) {
          expect(titleBox.width).toBeLessThanOrEqual(width);
        }
      });

      test("should render projects section correctly", async ({ page }) => {
        const projectsSection = page.locator("#projects");
        await expect(projectsSection).toBeVisible();

        // Check search input
        const searchInput = projectsSection.locator('input[type="text"]');
        await expect(searchInput).toBeVisible();

        // Check filter buttons
        const filterButtons = projectsSection.locator("button").filter({
          hasText: /All|Active|Paused|Archived/,
        });
        const count = await filterButtons.count();
        expect(count).toBeGreaterThan(0);

        // Verify all filter buttons are visible and don't overflow
        for (let i = 0; i < count; i++) {
          const button = filterButtons.nth(i);
          await expect(button).toBeVisible();
        }
      });

      test("should display project cards in correct grid layout", async ({
        page,
      }) => {
        const projectCards = page.locator('[role="button"]').filter({
          has: page.locator("h3"),
        });

        // Wait for cards to load
        await expect(projectCards.first()).toBeVisible({ timeout: 10000 });

        const cardCount = await projectCards.count();
        expect(cardCount).toBeGreaterThan(0);

        // Check that cards are visible and properly sized
        for (let i = 0; i < Math.min(3, cardCount); i++) {
          const card = projectCards.nth(i);
          await expect(card).toBeVisible();

          const box = await card.boundingBox();
          expect(box).not.toBeNull();
          if (box) {
            // Cards should not overflow viewport width
            expect(box.width).toBeLessThanOrEqual(width);
          }
        }
      });

      test("should render footer correctly", async ({ page }) => {
        const footer = page.locator("footer");
        await expect(footer).toBeVisible();

        // Check footer text wraps properly
        const footerText = footer.locator("p");
        await expect(footerText).toBeVisible();

        const footerBox = await footerText.boundingBox();
        expect(footerBox).not.toBeNull();
        if (footerBox) {
          expect(footerBox.width).toBeLessThanOrEqual(width);
        }
      });

      test("should open and display project modal correctly", async ({
        page,
      }) => {
        // Wait for project cards to load
        const projectCard = page.locator('[role="button"]').filter({
          has: page.locator("h3"),
        });
        await expect(projectCard.first()).toBeVisible({ timeout: 10000 });

        // Click first project card
        await projectCard.first().click();

        // Check modal is visible
        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible();

        // Check modal content is visible
        const modalTitle = modal.locator("h2");
        await expect(modalTitle).toBeVisible();

        // Check close button is accessible
        const closeButton = modal.locator('button[aria-label*="close"]');
        await expect(closeButton).toBeVisible();

        // Verify modal doesn't overflow viewport
        const modalBox = await modal.boundingBox();
        expect(modalBox).not.toBeNull();
        if (modalBox) {
          expect(modalBox.width).toBeLessThanOrEqual(width);
          expect(modalBox.height).toBeLessThanOrEqual(height);
        }

        // Check buttons stack correctly on mobile
        if (key === "mobile") {
          const buttons = modal.locator("a").filter({
            hasText: /Homepage|Repository|Docs/,
          });
          const buttonCount = await buttons.count();

          if (buttonCount > 0) {
            // Buttons should be full width on mobile
            for (let i = 0; i < buttonCount; i++) {
              const button = buttons.nth(i);
              const buttonBox = await button.boundingBox();
              if (buttonBox) {
                // Should be close to full modal width (accounting for padding)
                expect(buttonBox.width).toBeGreaterThan(width * 0.7);
              }
            }
          }
        }

        // Close modal
        await closeButton.click();
        await expect(modal).not.toBeVisible();
      });

      test("should handle horizontal scrolling", async ({ page }) => {
        // Check for horizontal overflow
        const bodyScrollWidth = await page.evaluate(() => {
          return document.body.scrollWidth;
        });

        // Body scroll width should not exceed viewport width (with small tolerance)
        expect(bodyScrollWidth).toBeLessThanOrEqual(width + 20);
      });

      test("should have accessible touch targets on mobile", async ({
        page,
      }) => {
        if (key !== "mobile") {
          test.skip();
        }

        // Check that interactive elements are large enough
        const interactiveElements = page.locator(
          'button, a[href], input, [role="button"]',
        );
        const count = await interactiveElements.count();

        for (let i = 0; i < Math.min(10, count); i++) {
          const element = interactiveElements.nth(i);
          if (await element.isVisible()) {
            const box = await element.boundingBox();
            if (box) {
              // Touch targets should be at least 44x44 (WCAG guideline)
              // Allow some elements to be smaller if they're in a group
              if (box.height < 44 || box.width < 44) {
                // Check if element is part of a larger clickable area
                const parent = element.locator("..");
                const parentBox = await parent.boundingBox();
                if (parentBox) {
                  expect(
                    parentBox.height >= 44 || parentBox.width >= 44,
                  ).toBeTruthy();
                }
              }
            }
          }
        }
      });
    });
  });

  test.describe("Responsive behavior", () => {
    test("should show mobile menu on small screens", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/");

      // Mobile menu button should be visible
      const menuButton = page.locator('[aria-label*="menu"]').first();
      await expect(menuButton).toBeVisible();

      // Click to open menu
      await menuButton.click();

      // Check that menu items appear
      const menuNav = page.locator("nav").filter({ hasText: /GitHub/ });
      await expect(menuNav).toBeVisible();
    });

    test("should hide mobile menu on desktop", async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto("/");

      // Mobile menu button should not be visible
      const menuButton = page.locator('[aria-label*="menu"]');
      await expect(menuButton).not.toBeVisible();

      // Desktop GitHub link should be visible
      const githubLink = page
        .locator('a[href*="github.com"]')
        .filter({ hasText: /^$/ });
      await expect(githubLink.first()).toBeVisible();
    });

    test("should adapt grid layout across breakpoints", async ({ page }) => {
      await page.goto("/");

      // Test mobile grid (1 column)
      await page.setViewportSize({ width: 375, height: 667 });
      const projectsGrid = page
        .locator("#projects")
        .locator("div")
        .filter({
          has: page.locator('[role="button"]'),
        });
      await expect(projectsGrid).toHaveClass(/grid-cols-1/);

      // Test tablet grid (2 columns)
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(projectsGrid).toHaveClass(/md:grid-cols-2/);

      // Test desktop grid (3 columns)
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(projectsGrid).toHaveClass(/lg:grid-cols-3/);
    });
  });
});
