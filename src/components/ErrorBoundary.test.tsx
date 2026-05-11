import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

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
    expect(screen.getByText("Test error")).toBeInTheDocument();
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

  it("renders error ID in the DOM", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    const errorIdElement = screen.getByText(/^Error ID: /);
    expect(errorIdElement).toBeInTheDocument();
    // Verify the ID is a non-empty string after the prefix
    const errorId = errorIdElement.textContent?.replace("Error ID: ", "");
    expect(errorId).toBeTruthy();
    expect(errorId!.length).toBeGreaterThan(0);
  });

  it("includes errorId in console.error call", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    const loggedArgs = consoleSpy.mock.calls.find(
      (call: unknown[]) => call[0] === "[ErrorBoundary]",
    );
    expect(loggedArgs).toBeDefined();
    // The last argument should be { errorId: string }
    const contextArg = loggedArgs![loggedArgs!.length - 1] as {
      errorId?: string;
    };
    expect(contextArg.errorId).toBeTruthy();
  });

  it("does not render error message when error has no message", () => {
    const ThrowEmptyError = () => {
      throw new Error();
    };

    const { container } = render(
      <ErrorBoundary>
        <ThrowEmptyError />
      </ErrorBoundary>,
    );

    expect(screen.getByText("errorBoundary.title")).toBeInTheDocument();
    // Error ID is always rendered when an error occurs
    const errorIdElements = container.querySelectorAll(".font-mono");
    // Only the error ID paragraph should be present (no error.message since it's empty)
    const errorIdText = Array.from(errorIdElements).find((el) =>
      el.textContent?.startsWith("Error ID:"),
    );
    expect(errorIdText).toBeInTheDocument();
  });
});
