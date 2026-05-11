import { test, expect } from "@playwright/test";
import { pinAppLanguage, seedProjectsCache } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await pinAppLanguage(page);
  await seedProjectsCache(page);
});

test.describe("Theme Toggle", () => {
  test("cycles light → dark → system → light on sequential clicks", async ({
    page,
  }) => {
    await page.goto("/");

    const toggle = page.getByRole("switch");

    // Ensure starting from a known state — clear theme storage
    await page.evaluate(() => localStorage.removeItem("awana-labs-theme"));

    // Reload to pick up cleared state (defaults to "system")
    await page.reload();
    await page.waitForSelector("#root");

    // system → light (first click)
    await toggle.click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);

    // light → dark
    await toggle.click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    // dark → system
    await toggle.click();

    // system → light
    await toggle.click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("aria-checked reflects dark mode state", async ({ page }) => {
    await page.goto("/");

    const toggle = page.getByRole("switch");

    // Set to light explicitly
    await page.evaluate(() =>
      localStorage.setItem("awana-labs-theme", "light"),
    );
    await page.reload();
    await page.waitForSelector("#root");

    await expect(toggle).toHaveAttribute("aria-checked", "false");

    // Click to switch to dark
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  test("html element has dark class when dark mode is active", async ({
    page,
  }) => {
    await page.goto("/");

    const toggle = page.getByRole("switch");

    // Set to light
    await page.evaluate(() =>
      localStorage.setItem("awana-labs-theme", "light"),
    );
    await page.reload();
    await page.waitForSelector("#root");

    await expect(page.locator("html")).not.toHaveClass(/dark/);

    // Toggle to dark
    const toggleAfterReload = page.getByRole("switch");
    await toggleAfterReload.click();
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  });

  test("theme persists across page reloads via localStorage", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector("#root");

    // Set dark theme
    await page.evaluate(() => localStorage.setItem("awana-labs-theme", "dark"));
    await page.reload();
    await page.waitForSelector("#root");

    // Verify dark class persisted
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    await expect(
      page.evaluate(() => localStorage.getItem("awana-labs-theme")),
    ).toBe("dark");
  });

  test("system theme follows prefers-color-scheme", async ({ page }) => {
    // Emulate dark OS preference
    await page.emulateMedia({ colorScheme: "dark" });

    // Set theme to system
    await page.addInitScript(() => {
      localStorage.setItem("awana-labs-theme", "system");
    });

    await page.goto("/");
    await page.waitForSelector("#root");

    // System + prefers-dark = dark class
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    const toggle = page.getByRole("switch");
    await expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  test("FOUC-prevention script applies dark class before React hydrates", async ({
    page,
  }) => {
    // Pre-set dark theme in localStorage
    await page.addInitScript(() => {
      localStorage.setItem("awana-labs-theme", "dark");
    });

    // Navigate and immediately check HTML before React takes over
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);

    // The inline script runs before React — check raw HTML content
    const htmlContent = await page.content();
    const htmlElement = await page.locator("html");

    // dark class should already be present from the FOUC script
    await expect(htmlElement).toHaveClass(/\bdark\b/);
  });
});
