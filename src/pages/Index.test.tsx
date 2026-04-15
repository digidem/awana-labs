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

vi.mock("@/components/GallerySkeleton", () => ({
  default: ({ count }: { count?: number }) => (
    <div data-testid="gallery-skeleton">Skeleton: {count ?? 6}</div>
  ),
}));

vi.mock("@/components/ScrollToTop", () => ({
  default: () => null,
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

  it("shows skeleton when loading with no cache", () => {
    mockUseProjectsWithError.mockReturnValue({
      projects: [],
      isLoading: true,
      isFetching: true,
      isPlaceholderData: false,
      isError: false,
      error: null,
      errorType: null,
      isOfflineError: false,
      isRateLimitError: false,
      errorMessage: null,
      refetch: vi.fn(),
    });

    renderIndex();

    // Should show the full layout with skeleton, not a loading spinner
    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("Hero")).toBeInTheDocument();
    expect(screen.getByTestId("gallery-skeleton")).toBeInTheDocument();
    // Should NOT show the old loading text
    expect(screen.queryByText("Loading projects")).not.toBeInTheDocument();
  });

  it("renders projects from placeholder data immediately", async () => {
    mockUseProjectsWithError.mockReturnValue({
      projects: [{ id: "1" }] as unknown as ReturnType<
        typeof useProjectsWithError
      >["projects"],
      isLoading: false,
      isFetching: true,
      isPlaceholderData: true,
      isError: false,
      error: null,
      errorType: null,
      isOfflineError: false,
      isRateLimitError: false,
      errorMessage: null,
      refetch: vi.fn(),
    });

    renderIndex();

    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("Hero")).toBeInTheDocument();
    // ProjectsGallery is lazy-loaded; wait for Suspense to resolve
    expect(await screen.findByText("Projects: 1")).toBeInTheDocument();
    expect(screen.queryByTestId("gallery-skeleton")).not.toBeInTheDocument();
  });

  it("renders a localized offline message", () => {
    mockUseProjectsWithError.mockReturnValue({
      projects: [],
      isLoading: false,
      isFetching: false,
      isPlaceholderData: false,
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
      isFetching: false,
      isPlaceholderData: false,
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
      isFetching: false,
      isPlaceholderData: false,
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

  it("shows cached projects when fetch fails but placeholder data exists", () => {
    mockUseProjectsWithError.mockReturnValue({
      projects: [{ id: "1" }] as unknown as ReturnType<
        typeof useProjectsWithError
      >["projects"],
      isLoading: false,
      isFetching: false,
      isPlaceholderData: false,
      isError: true,
      error: new Error("Network error"),
      errorType: "generic",
      isOfflineError: false,
      isRateLimitError: false,
      errorMessage: "Network error",
      refetch: vi.fn(),
    });

    renderIndex();

    // Should show projects from cache, not error screen
    expect(screen.getByText("Projects: 1")).toBeInTheDocument();
    // Full-screen error layout should not be shown (its title would be present)
    expect(
      screen.queryByText("Unable to load projects"),
    ).not.toBeInTheDocument();
    // Should show stale data warning
    expect(
      screen.getByText("Showing cached projects. Data may be outdated."),
    ).toBeInTheDocument();
  });

  it("renders Footer eagerly (not behind Suspense)", () => {
    mockUseProjectsWithError.mockReturnValue({
      projects: [{ id: "1" }] as unknown as ReturnType<
        typeof useProjectsWithError
      >["projects"],
      isLoading: false,
      isFetching: false,
      isPlaceholderData: false,
      isError: false,
      error: null,
      errorType: null,
      isOfflineError: false,
      isRateLimitError: false,
      errorMessage: null,
      refetch: vi.fn(),
    });

    renderIndex();

    expect(screen.getByText("Footer")).toBeInTheDocument();
  });

  it("does not show stale data warning when data is fresh", () => {
    mockUseProjectsWithError.mockReturnValue({
      projects: [{ id: "1" }] as unknown as ReturnType<
        typeof useProjectsWithError
      >["projects"],
      isLoading: false,
      isFetching: false,
      isPlaceholderData: false,
      isError: false,
      error: null,
      errorType: null,
      isOfflineError: false,
      isRateLimitError: false,
      errorMessage: null,
      refetch: vi.fn(),
    });

    renderIndex();

    expect(
      screen.queryByText("Showing cached projects. Data may be outdated."),
    ).not.toBeInTheDocument();
  });
});
