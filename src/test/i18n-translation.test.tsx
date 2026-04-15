import { describe, it, expect, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { I18nextProvider, useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";
import { StatusBadge } from "@/components/StatusBadge";

// Simple test component that uses translations
function TestComponent() {
  const { t } = useTranslation();
  return (
    <div>
      <h1>{t("hero.title")}</h1>
      <p>{t("hero.tagline")}</p>
      <button>{t("hero.cta")}</button>
      <footer>
        {t("footer.madeWith")} {t("footer.by")}
      </footer>
    </div>
  );
}

describe("i18n Translation Tests", () => {
  beforeEach(async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  const collectTranslationKeys = (value: unknown, prefix = ""): string[] => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return [];
    }

    return Object.entries(value as Record<string, unknown>).flatMap(
      ([key, child]) => {
        const path = prefix ? `${prefix}.${key}` : key;

        if (child && typeof child === "object" && !Array.isArray(child)) {
          return collectTranslationKeys(child, path);
        }

        return [path];
      },
    );
  };

  describe("Basic Translation Functionality", () => {
    it("renders translations in English by default", async () => {
      render(
        <I18nextProvider i18n={i18n}>
          <TestComponent />
        </I18nextProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText("Awana Labs")).toBeInTheDocument();
        expect(
          screen.getByText("Where experiments become essential tools"),
        ).toBeInTheDocument();
        expect(screen.getByText("Explore Projects")).toBeInTheDocument();
        expect(screen.getByText(/Made with/)).toBeInTheDocument();
        expect(screen.getByText(/by/)).toBeInTheDocument();
      });
    });

    it("switches translations to Portuguese", async () => {
      await i18n.changeLanguage("pt");

      render(
        <I18nextProvider i18n={i18n}>
          <TestComponent />
        </I18nextProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText("Awana Labs")).toBeInTheDocument();
        expect(
          screen.getByText(
            "Onde experimentos se tornam ferramentas essenciais",
          ),
        ).toBeInTheDocument();
        expect(screen.getByText("Explorar Projetos")).toBeInTheDocument();
        expect(screen.getByText(/Feito com/)).toBeInTheDocument();
        expect(screen.getByText(/por/)).toBeInTheDocument();
      });
    });

    it("switches translations to Spanish", async () => {
      await i18n.changeLanguage("es");

      render(
        <I18nextProvider i18n={i18n}>
          <TestComponent />
        </I18nextProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText("Awana Labs")).toBeInTheDocument();
        expect(
          screen.getByText(
            "Donde los experimentos se convierten en herramientas esenciales",
          ),
        ).toBeInTheDocument();
        expect(screen.getByText("Explorar Proyectos")).toBeInTheDocument();
        expect(screen.getByText(/Hecho con/)).toBeInTheDocument();
        expect(screen.getByText(/por/)).toBeInTheDocument();
      });
    });
  });

  describe("StatusBadge Component Translations", () => {
    it("renders status badges in English", async () => {
      const { rerender } = render(
        <I18nextProvider i18n={i18n}>
          <StatusBadge state="active" usage="widely-used" />
        </I18nextProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText("Active")).toBeInTheDocument();
        expect(screen.getByText("Widely Used")).toBeInTheDocument();
      });

      rerender(
        <I18nextProvider i18n={i18n}>
          <StatusBadge state="paused" usage="used" />
        </I18nextProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText("Paused")).toBeInTheDocument();
        expect(screen.getByText("In Use")).toBeInTheDocument();
      });

      rerender(
        <I18nextProvider i18n={i18n}>
          <StatusBadge state="archived" usage="experimental" />
        </I18nextProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText("Archived")).toBeInTheDocument();
        expect(screen.getByText("Experimental")).toBeInTheDocument();
      });
    });

    it("switches status badges to Portuguese", async () => {
      await i18n.changeLanguage("pt");

      const { rerender } = render(
        <I18nextProvider i18n={i18n}>
          <StatusBadge state="active" usage="widely-used" />
        </I18nextProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText("Ativo")).toBeInTheDocument();
        expect(screen.getByText("Amplamente Usado")).toBeInTheDocument();
      });

      rerender(
        <I18nextProvider i18n={i18n}>
          <StatusBadge state="paused" usage="used" />
        </I18nextProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText("Pausado")).toBeInTheDocument();
        expect(screen.getByText("Em Uso")).toBeInTheDocument();
      });

      rerender(
        <I18nextProvider i18n={i18n}>
          <StatusBadge state="archived" usage="experimental" />
        </I18nextProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText("Arquivado")).toBeInTheDocument();
        expect(screen.getByText("Experimental")).toBeInTheDocument();
      });
    });

    it("switches status badges to Spanish", async () => {
      await i18n.changeLanguage("es");

      const { rerender } = render(
        <I18nextProvider i18n={i18n}>
          <StatusBadge state="active" usage="widely-used" />
        </I18nextProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText("Activo")).toBeInTheDocument();
        expect(screen.getByText("Ampliamente Usado")).toBeInTheDocument();
      });

      rerender(
        <I18nextProvider i18n={i18n}>
          <StatusBadge state="paused" usage="used" />
        </I18nextProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText("Pausado")).toBeInTheDocument();
        expect(screen.getByText("En Uso")).toBeInTheDocument();
      });

      rerender(
        <I18nextProvider i18n={i18n}>
          <StatusBadge state="archived" usage="experimental" />
        </I18nextProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText("Archivado")).toBeInTheDocument();
        expect(screen.getByText("Experimental")).toBeInTheDocument();
      });
    });
  });

  describe("Dynamic Language Switching", () => {
    it("updates UI when language changes dynamically", async () => {
      const { rerender } = render(
        <I18nextProvider i18n={i18n}>
          <TestComponent />
        </I18nextProvider>,
      );

      // Start in English
      await waitFor(() => {
        expect(
          screen.getByText("Where experiments become essential tools"),
        ).toBeInTheDocument();
      });

      // Switch to Portuguese
      await act(async () => {
        await i18n.changeLanguage("pt");
      });
      rerender(
        <I18nextProvider i18n={i18n}>
          <TestComponent />
        </I18nextProvider>,
      );

      await waitFor(() => {
        expect(
          screen.getByText(
            "Onde experimentos se tornam ferramentas essenciais",
          ),
        ).toBeInTheDocument();
      });

      // Switch to Spanish
      await act(async () => {
        await i18n.changeLanguage("es");
      });
      rerender(
        <I18nextProvider i18n={i18n}>
          <TestComponent />
        </I18nextProvider>,
      );

      await waitFor(() => {
        expect(
          screen.getByText(
            "Donde los experimentos se convierten en herramientas esenciales",
          ),
        ).toBeInTheDocument();
      });

      // Switch back to English
      await act(async () => {
        await i18n.changeLanguage("en");
      });
      rerender(
        <I18nextProvider i18n={i18n}>
          <TestComponent />
        </I18nextProvider>,
      );

      await waitFor(() => {
        expect(
          screen.getByText("Where experiments become essential tools"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Translation Key Validation", () => {
    it("ensures all translation keys exist in all languages", () => {
      const languages = ["en", "pt", "es"];
      const resources = i18n.options.resources as Record<
        string,
        { translation: Record<string, unknown> }
      >;

      // Get all leaf keys from English (reference language)
      const englishKeys = collectTranslationKeys(
        resources.en.translation,
      ).sort();

      languages.forEach((lang) => {
        const langKeys = collectTranslationKeys(
          resources[lang].translation,
        ).sort();
        expect(langKeys).toEqual(englishKeys);
      });
    });
  });
});
