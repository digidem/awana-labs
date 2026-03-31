import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";
import Index from "./Index";
import { useProjectsWithError } from "@/hooks/useProjects";

vi.mock("@/hooks/useProjects", () => ({
  useProjectsWithError: vi.fn(),
}));

vi.mock("@/components/Header", () => ({
  default: () => <div>Header</div>,
}));

vi.mock("@/components/Hero", () => ({
  default: () => <div>Hero</div>,
}));

vi.mock("@/components/Footer", () => ({
  default: () => <div>Footer</div>,
}));

vi.mock("@/components/ProjectsGallery", () => ({
  default: ({ projects }: { projects: Array<{ id: string }> }) => (
    <div>Projects: {projects.length}</div>
  ),
}));

const mockUseProjectsWithError = vi.mocked(useProjectsWithError);

function renderIndex() {
  return render(
    <I18nextProvider i18n={i18n}>
      <Index />
    </I18nextProvider>,
  );
}

describe("Index page states", () => {
  beforeEach(async () => {
    mockUseProjectsWithError.mockReset();

    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("renders localized loading copy", () => {
    mockUseProjectsWithError.mockReturnValue({
      projects: [],
      isLoading: true,
      isError: false,
      error: null,
      errorType: null,
      isOfflineError: false,
      isRateLimitError: false,
      errorMessage: null,
      refetch: vi.fn(),
    });

    renderIndex();

    expect(screen.getByText("Loading projects")).toBeInTheDocument();
    expect(
      screen.getByText("Fetching the latest published projects from GitHub."),
    ).toBeInTheDocument();
  });

  it("renders a localized offline message", () => {
    mockUseProjectsWithError.mockReturnValue({
      projects: [],
      isLoading: false,
      isError: true,
      error: new Error("Offline"),
      errorType: "offline",
      isOfflineError: true,
      isRateLimitError: false,
      errorMessage: "Offline",
      refetch: vi.fn(),
    });

    renderIndex();

    expect(screen.getByText("You're offline")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Reconnect to the internet and try again, or return when cached projects are available.",
      ),
    ).toBeInTheDocument();
  });

  it("uses refetch for timeout retries", () => {
    const refetch = vi.fn();
    mockUseProjectsWithError.mockReturnValue({
      projects: [],
      isLoading: false,
      isError: true,
      error: new Error("Request timeout"),
      errorType: "timeout",
      isOfflineError: false,
      isRateLimitError: false,
      errorMessage: "Request timeout",
      refetch,
    });

    renderIndex();

    expect(screen.getByText("Project request timed out")).toBeInTheDocument();
    expect(
      screen.getByText("GitHub took too long to respond. Try again."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("renders a localized rate-limit message", () => {
    mockUseProjectsWithError.mockReturnValue({
      projects: [],
      isLoading: false,
      isError: true,
      error: new Error("rate limit exceeded"),
      errorType: "rate-limit",
      isOfflineError: false,
      isRateLimitError: true,
      errorMessage: "rate limit exceeded",
      refetch: vi.fn(),
    });

    renderIndex();

    expect(screen.getByText("GitHub rate limit reached")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Too many requests to GitHub. Please wait a moment and try again.",
      ),
    ).toBeInTheDocument();
  });
});
