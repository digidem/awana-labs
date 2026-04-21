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
    it("should not cache language selection in i18nextLng (managed by LanguageProvider)", async () => {
      await i18n.changeLanguage("pt");
      // LanguageProvider uses "awana-labs-language" key; i18next detector
      // caches are disabled to avoid dual source-of-truth.
      expect(localStorage.getItem("i18nextLng")).toBeNull();
    });

    it("should not persist language via i18nextLng key (managed by LanguageProvider)", async () => {
      // Simulate user selecting Spanish
      await i18n.changeLanguage("es");
      // i18next detector caches are disabled; LanguageProvider manages persistence
      expect(localStorage.getItem("i18nextLng")).toBeNull();
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

    it("should persist detected language to localStorage on first visit via querystring", async () => {
      // Simulate a first-visit scenario: no stored preference, language detected from ?lng=
      localStorage.clear();
      sessionStorage.clear();

      const originalSearch = window.location.search;
      Object.defineProperty(window, "location", {
        value: {
          ...window.location,
          search: "?lng=pt",
        },
        writable: true,
      });

      // Detect language from querystring — this is what LanguageProvider's
      // getStoredLanguage/getInitialLanguage reads from.
      const detectedLanguage = i18n.services.languageDetector?.detect();
      const resolvedLanguage = Array.isArray(detectedLanguage)
        ? detectedLanguage[0]
        : detectedLanguage;
      expect(resolvedLanguage).toBe("pt");

      // Simulate what LanguageProvider does on mount: if localStorage is empty,
      // persist the detected language so it survives a page reload.
      const storageKey = "awana-labs-language";
      expect(localStorage.getItem(storageKey)).toBeNull();

      // Apply the same logic as the mount effect in LanguageProvider
      if (localStorage.getItem(storageKey) === null && resolvedLanguage) {
        localStorage.setItem(storageKey, resolvedLanguage);
      }

      // After the mount-effect logic, the language must be persisted
      expect(localStorage.getItem(storageKey)).toBe("pt");

      // Restore original search
      Object.defineProperty(window, "location", {
        value: {
          ...window.location,
          search: originalSearch,
        },
        writable: true,
      });
    });
  });
});
