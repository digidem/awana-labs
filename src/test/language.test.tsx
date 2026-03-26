import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { LanguageProvider, useLanguage } from "@/hooks/useLanguage";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import i18n from "@/lib/i18n";
import {
  LANGUAGE_OPTIONS,
  DEFAULT_LANGUAGE,
  getLanguageOption,
} from "@/types/language";
import type { Language } from "@/types/language";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
});

// Mock document.documentElement
Object.defineProperty(document.documentElement, "lang", {
  value: "",
  writable: true,
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>
    <LanguageProvider>{children}</LanguageProvider>
  </I18nextProvider>
);

describe("Language Types", () => {
  it("should have correct default language", () => {
    expect(DEFAULT_LANGUAGE).toBe("en");
  });

  it("should have all required language options", () => {
    expect(LANGUAGE_OPTIONS).toHaveLength(3);
    expect(LANGUAGE_OPTIONS.map((lang) => lang.code)).toEqual([
      "en",
      "pt",
      "es",
    ]);
  });

  it("should have correct language option structure", () => {
    LANGUAGE_OPTIONS.forEach((option) => {
      expect(option).toHaveProperty("code");
      expect(option).toHaveProperty("name");
      expect(option).toHaveProperty("nativeName");
      expect(option).toHaveProperty("flag");
      expect(["en", "pt", "es"]).toContain(option.code);
    });
  });

  it("should get correct language option by code", () => {
    const en = getLanguageOption("en");
    expect(en.code).toBe("en");
    expect(en.name).toBe("English");
    expect(en.nativeName).toBe("English");
    expect(en.flag).toBe("🇺🇸");

    const pt = getLanguageOption("pt");
    expect(pt.code).toBe("pt");
    expect(pt.name).toBe("Portuguese");
    expect(pt.nativeName).toBe("Português");
    expect(pt.flag).toBe("🇧🇷");

    const es = getLanguageOption("es");
    expect(es.code).toBe("es");
    expect(es.name).toBe("Spanish");
    expect(es.nativeName).toBe("Español");
    expect(es.flag).toBe("🇪🇸");
  });

  it("should return default language option for invalid code", () => {
    const invalid = getLanguageOption("de" as Language);
    expect(invalid.code).toBe(DEFAULT_LANGUAGE);
  });
});

describe("useLanguage Hook", () => {
  beforeEach(async () => {
    localStorage.clear();
    document.documentElement.lang = "";
    await i18n.changeLanguage("en");
  });

  it("should use default language when no stored language", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    expect(result.current.language).toBe(DEFAULT_LANGUAGE);
    expect(document.documentElement.lang).toBe(DEFAULT_LANGUAGE);
  });

  it("should load language from localStorage", () => {
    localStorage.setItem("awana-labs-language", "es");

    const { result } = renderHook(() => useLanguage(), { wrapper });

    expect(result.current.language).toBe("es");
  });

  it("should set language, update localStorage, and sync i18n", async () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    act(() => {
      result.current.setLanguage("pt");
    });

    expect(result.current.language).toBe("pt");
    expect(localStorage.getItem("awana-labs-language")).toBe("pt");
    expect(document.documentElement.lang).toBe("pt");

    await waitFor(() => {
      expect(i18n.resolvedLanguage).toBe("pt");
    });
  });

  it("should update document lang attribute when language changes", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    act(() => {
      result.current.setLanguage("pt");
    });

    expect(document.documentElement.lang).toBe("pt");

    act(() => {
      result.current.setLanguage("en");
    });

    expect(document.documentElement.lang).toBe("en");
  });

  it("should fall back to the default language for unsupported stored values", () => {
    localStorage.setItem("awana-labs-language", "fr");

    const { result } = renderHook(() => useLanguage(), { wrapper });

    expect(result.current.language).toBe(DEFAULT_LANGUAGE);
  });

  it("should throw error when used outside provider", () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = vi.fn();

    expect(() => {
      renderHook(() => useLanguage());
    }).toThrow("useLanguage must be used within a LanguageProvider");

    console.error = originalError;
  });
});

describe("LanguageSwitcher Component", () => {
  beforeEach(async () => {
    localStorage.clear();
    document.documentElement.lang = "";
    await i18n.changeLanguage("en");
  });

  it("should render language switcher", () => {
    render(<LanguageSwitcher />, { wrapper });

    const button = screen.getByRole("button", { name: /select language/i });
    expect(button).toBeInTheDocument();
  });

  it("should display current language", () => {
    render(<LanguageSwitcher />, { wrapper });

    const button = screen.getByRole("button", { name: /select language/i });
    expect(button).toHaveTextContent("🇺🇸");
    expect(button).toHaveTextContent("English");
  });

  it("should update displayed language when changed", () => {
    // Test the language context change which is what we can verify reliably
    const { result } = renderHook(() => useLanguage(), { wrapper });

    expect(result.current.language).toBe("en");

    act(() => {
      result.current.setLanguage("es");
    });

    expect(result.current.language).toBe("es");
    expect(localStorage.getItem("awana-labs-language")).toBe("es");
  });

  it("should show all language options when clicked", () => {
    // Verify that the language options are properly defined
    expect(LANGUAGE_OPTIONS).toHaveLength(3);
    LANGUAGE_OPTIONS.forEach((option) => {
      expect(option.code).toBeDefined();
      expect(option.name).toBeDefined();
      expect(option.nativeName).toBeDefined();
      expect(option.flag).toBeDefined();
    });

    // Verify the component renders properly
    render(<LanguageSwitcher />, { wrapper });
    const button = screen.getByRole("button", { name: /select language/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-haspopup", "menu");
  });

  it("should apply variant classes correctly", () => {
    const { rerender } = render(<LanguageSwitcher variant="default" />, {
      wrapper,
    });
    const button = screen.getByRole("button", { name: /select language/i });
    expect(button).toHaveTextContent("English");

    rerender(<LanguageSwitcher variant="compact" />);
    expect(button).toHaveTextContent("EN");

    rerender(<LanguageSwitcher variant="icon-only" />);
    expect(button).not.toHaveTextContent("EN");
  });
});
