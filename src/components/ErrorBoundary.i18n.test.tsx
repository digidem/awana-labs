import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import i18n from "@/lib/i18n";
import { I18nextProvider } from "react-i18next";

// No mock for react-i18next — these tests use the real i18n instance
// to verify that ErrorDisplay re-renders when language changes.

describe("ErrorBoundary i18n reactivity", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  const originalLanguage = i18n.language;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    consoleSpy.mockRestore();
    await act(() => i18n.changeLanguage(originalLanguage));
  });

  const ThrowError = () => {
    throw new Error("Test error");
  };

  const renderWithI18n = (ui: React.ReactElement) =>
    render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);

  it("updates error UI when language changes", async () => {
    await act(() => i18n.changeLanguage("en"));

    renderWithI18n(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    // Initially in English
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Try Again" }),
    ).toBeInTheDocument();

    // Switch to Portuguese
    await act(() => i18n.changeLanguage("pt"));

    // UI should now show Portuguese translations
    expect(screen.getByText("Algo deu errado")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Tentar Novamente" }),
    ).toBeInTheDocument();

    // English text should be gone
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  it("does not throw on unmount after language change", async () => {
    await act(() => i18n.changeLanguage("en"));

    const { unmount } = renderWithI18n(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    await act(() => i18n.changeLanguage("pt"));

    // Unmount should not throw — cleanup is automatic via React hook lifecycle
    expect(() => unmount()).not.toThrow();
  });
});
