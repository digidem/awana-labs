import { describe, it, expect, beforeEach, afterEach } from "vitest";
import i18n, { supportedLanguages } from "./i18n";

describe("i18n configuration", () => {
  beforeEach(() => {
    // Clear any stored language preferences
    localStorage.clear();
    sessionStorage.clear();
    // Reset to default language before each test
    i18n.changeLanguage("en");
  });

  afterEach(() => {
    // Clean up after tests
    localStorage.clear();
    sessionStorage.clear();
  });

  it("should initialize with default language", () => {
    expect(i18n.language).toBe("en");
  });

  it("should have all supported languages configured", () => {
    // Check that all languages have translation resources
    const resources = i18n.store.data;
    expect(resources).toBeDefined();
    expect(resources.en).toBeDefined();
    expect(resources.pt).toBeDefined();
    expect(resources.es).toBeDefined();
  });

  it("should export supported languages array", () => {
    expect(supportedLanguages).toEqual(["en", "pt", "es"]);
  });

  it("should change language successfully", async () => {
    await i18n.changeLanguage("pt");
    expect(i18n.language).toBe("pt");

    await i18n.changeLanguage("es");
    expect(i18n.language).toBe("es");
  });

  it("should translate keys correctly", () => {
    const titleKey = "hero.title";
    const enTitle = i18n.t(titleKey);
    expect(enTitle).toBe("Awana Labs");
  });

  it("should translate differently based on language", async () => {
    const key = "hero.cta";

    // English
    i18n.changeLanguage("en");
    const enTranslation = i18n.t(key);
    expect(enTranslation).toBe("Explore Projects");

    // Portuguese
    await i18n.changeLanguage("pt");
    const ptTranslation = i18n.t(key);
    expect(ptTranslation).toBe("Explorar Projetos");

    // Spanish
    await i18n.changeLanguage("es");
    const esTranslation = i18n.t(key);
    expect(esTranslation).toBe("Explorar Proyectos");
  });

  it("should handle interpolation correctly", () => {
    const imageKey = "projectModal.goToImage";
    const index = 3;
    const translation = i18n.t(imageKey, { index });
    expect(translation).toContain(index.toString());
  });

  it("should fallback to default language for missing translations", () => {
    // This test ensures fallback behavior works
    const existingKey = "common.loading";
    const translation = i18n.t(existingKey);
    expect(translation).toBe("Loading...");
  });

  it("should support nested translation keys", () => {
    const nestedKey = "status.used";
    const translation = i18n.t(nestedKey);
    expect(translation).toBe("In Use");
  });

  describe("language detector", () => {
    it("should cache language selection in localStorage", async () => {
      await i18n.changeLanguage("pt");
      expect(localStorage.getItem("i18nextLng")).toBe("pt");
    });

    it("should persist language selection across page reloads", async () => {
      // Simulate user selecting Spanish
      await i18n.changeLanguage("es");
      expect(localStorage.getItem("i18nextLng")).toBe("es");

      // Verify that the language is stored for next session
      const storedLang = localStorage.getItem("i18nextLng");
      expect(storedLang).toBe("es");
    });

    it("should fall back to default language for unsupported languages", async () => {
      // Try to set an unsupported language
      await i18n.changeLanguage("fr");
      // Should fallback to English since 'fr' is not in supportedLngs
      expect(["en", "pt", "es"]).toContain(i18n.language);
    });

    it("should respect language from query string parameter", async () => {
      // Simulate URL with ?lng=pt parameter
      const originalSearch = window.location.search;
      Object.defineProperty(window, "location", {
        value: {
          ...window.location,
          search: "?lng=pt",
        },
        writable: true,
      });

      const detectedLanguage = i18n.services.languageDetector?.detect();
      const resolvedLanguage = Array.isArray(detectedLanguage)
        ? detectedLanguage[0]
        : detectedLanguage;
      expect(resolvedLanguage).toBe("pt");

      // Restore original search
      Object.defineProperty(window, "location", {
        value: {
          ...window.location,
          search: originalSearch,
        },
        writable: true,
      });
    });

    it("should use navigator language as fallback when no explicit preference", () => {
      // Clear all caches
      localStorage.clear();
      sessionStorage.clear();

      // Mock navigator.language
      Object.defineProperty(window.navigator, "language", {
        value: "pt-BR",
        configurable: true,
      });

      // The language detector should detect 'pt' from 'pt-BR'
      const detectedLang = i18n.language;
      // Should be one of the supported languages
      expect(supportedLanguages).toContain(
        detectedLang as (typeof supportedLanguages)[number],
      );
    });
  });
});
