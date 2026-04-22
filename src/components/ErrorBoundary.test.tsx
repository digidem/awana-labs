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

  it("displays correct translation keys in error UI", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("errorBoundary.title")).toBeInTheDocument();
    expect(screen.getByText("errorBoundary.description")).toBeInTheDocument();
    expect(screen.getByText("Test error")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "errorBoundary.retry" }),
    ).toBeInTheDocument();
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
    // No error message paragraph should be rendered when message is empty
    const monoElements = container.querySelectorAll(".font-mono");
    expect(monoElements).toHaveLength(0);
  });
});
