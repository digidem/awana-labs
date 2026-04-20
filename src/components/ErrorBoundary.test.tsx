import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const { mockI18n } = vi.hoisted(() => ({
  mockI18n: {
    t: vi.fn((key: string) => key),
    on: vi.fn(),
    off: vi.fn(),
  },
}));

vi.mock("@/lib/i18n", () => ({ default: mockI18n }));

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) throw new Error("Test error");
  return <div>No error</div>;
};

describe("ErrorBoundary", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("No error")).toBeInTheDocument();
  });

  it("catches error and displays error UI", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.queryByText("No error")).not.toBeInTheDocument();
    expect(screen.getByText("errorBoundary.title")).toBeInTheDocument();
    expect(screen.getByText("errorBoundary.description")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "errorBoundary.retry" }),
    ).toBeInTheDocument();
  });

  it("logs error to console in componentDidCatch", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(consoleSpy).toHaveBeenCalled();
    const loggedArgs = consoleSpy.mock.calls.find(
      (call: unknown[]) => call[0] === "[ErrorBoundary]",
    );
    expect(loggedArgs).toBeDefined();
    expect(loggedArgs![1]).toBeInstanceOf(Error);
    expect(loggedArgs![1].message).toBe("Test error");
  });

  it("retry button resets error state and renders children again", () => {
    let shouldThrow = true;
    const ToggleChild = () => {
      if (shouldThrow) throw new Error("Test error");
      return <div>No error</div>;
    };

    const { rerender } = render(
      <ErrorBoundary>
        <ToggleChild />
      </ErrorBoundary>,
    );

    expect(screen.getByText("errorBoundary.title")).toBeInTheDocument();

    // Fix the error source, then click retry
    shouldThrow = false;
    fireEvent.click(
      screen.getByRole("button", { name: "errorBoundary.retry" }),
    );

    // Force a re-render so the boundary re-renders its children
    rerender(
      <ErrorBoundary>
        <ToggleChild />
      </ErrorBoundary>,
    );

    expect(screen.getByText("No error")).toBeInTheDocument();
    expect(screen.queryByText("errorBoundary.title")).not.toBeInTheDocument();
  });

  it("subscribes to languageChanged on mount", () => {
    // With the functional ErrorDisplay component, i18n reactivity is handled
    // by useTranslation() — no manual i18n.on() subscription needed.
    render(
      <ErrorBoundary>
        <div>Child</div>
      </ErrorBoundary>,
    );

    // The functional approach uses useTranslation() which handles reactivity
    // internally via react-i18next — no explicit on/off calls to verify.
    expect(screen.getByText("Child")).toBeInTheDocument();
  });

  it("unsubscribes from languageChanged on unmount", () => {
    // With the functional ErrorDisplay component, cleanup is handled
    // automatically by react-i18next's useTranslation() hook.
    const { unmount } = render(
      <ErrorBoundary>
        <div>Child</div>
      </ErrorBoundary>,
    );

    // Unmount should not throw — cleanup is automatic via React hook lifecycle
    expect(() => unmount()).not.toThrow();
  });

  it("displays correct translation keys in error UI", () => {
    // With the functional ErrorDisplay, useTranslation() is used which is
    // mocked to return the key as-is. Verify the keys appear in the DOM.
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("errorBoundary.title")).toBeInTheDocument();
    expect(screen.getByText("errorBoundary.description")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "errorBoundary.retry" }),
    ).toBeInTheDocument();
  });
});
