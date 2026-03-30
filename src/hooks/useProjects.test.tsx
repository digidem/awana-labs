/**
 * Tests for useProjects hook
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useProjects, useProjectsWithError } from "./useProjects";
import { GitHubApiError } from "@/lib/github";
import * as api from "@/lib/api";

// Mock the API module
vi.mock("@/lib/api", () => ({
  PROJECTS_CACHE_MAX_AGE_MS: 60 * 60 * 1000,
  PROJECTS_DATA_UPDATED_EVENT: "awana-labs-projects-updated",
  queryKeys: {
    projects: ["projects"] as const,
  },
  fetchProjectsQuery: vi.fn(),
  getProjectLoadErrorType: vi.fn(() => "generic"),
  getErrorMessage: vi.fn((error) => error?.message ?? "Unknown error"),
}));

const mockFetchProjectsQuery = vi.mocked(api.fetchProjectsQuery);
const mockGetProjectLoadErrorType = vi.mocked(api.getProjectLoadErrorType);

describe("useProjects", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    mockFetchProjectsQuery.mockClear();
    mockGetProjectLoadErrorType.mockClear();
  });

  function createWrapper(client: QueryClient) {
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      );
    };
  }

  it("should fetch projects successfully", async () => {
    const mockData = {
      projects: [
        {
          id: "1",
          issue_number: 1,
          title: "Test Project",
          slug: "test-project",
          description: "A test project",
          organization: {
            name: "Test Org",
            short_name: "Test",
            url: "https://example.com",
          },
          status: {
            state: "active" as const,
            usage: "experimental" as const,
            notes: "",
          },
          tags: ["test"],
          media: {
            logo: "",
            images: [],
          },
          links: {
            homepage: "",
            repository: "",
            documentation: "",
          },
          timestamps: {
            created_at: "2024-01-01",
            last_updated_at: "2024-01-01",
          },
        },
      ],
    };

    mockFetchProjectsQuery.mockResolvedValue(mockData);

    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(mockData);
    expect(result.current.isError).toBe(false);
    expect(mockFetchProjectsQuery).toHaveBeenCalledTimes(1);
  });

  it("should handle fetch errors", async () => {
    const mockError = new Error("Failed to fetch");
    mockFetchProjectsQuery.mockRejectedValue(mockError);

    const { result } = renderHook(() => useProjects({ retry: 0 }), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 3000,
    });

    expect(result.current.error).toEqual(mockError);
    expect(result.current.data).toBeUndefined();
  });

  it("updates cached query data when the runtime refresh event fires", async () => {
    const initialData = {
      projects: [
        {
          id: "1",
          issue_number: 1,
          title: "Initial Project",
          slug: "initial-project",
          description: "Initial project data",
          organization: {
            name: "Test Org",
            short_name: "Test",
            url: "https://example.com",
          },
          status: {
            state: "active" as const,
            usage: "experimental" as const,
            notes: "",
          },
          tags: ["test"],
          media: {
            logo: "",
            images: [],
          },
          links: {
            homepage: "",
            repository: "",
            documentation: "",
          },
          timestamps: {
            created_at: "2024-01-01",
            last_updated_at: "2024-01-01",
          },
        },
      ],
    };
    const refreshedData = {
      projects: [
        {
          ...initialData.projects[0],
          id: "2",
          issue_number: 2,
          title: "Refreshed Project",
          slug: "refreshed-project",
          description: "Refreshed project data",
        },
      ],
    };

    mockFetchProjectsQuery.mockResolvedValue(initialData);

    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(initialData);

    window.dispatchEvent(
      new CustomEvent(api.PROJECTS_DATA_UPDATED_EVENT, {
        detail: refreshedData,
      }),
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(refreshedData);
    });
  });

  it("should respect enabled option", () => {
    const { result } = renderHook(() => useProjects({ enabled: false }), {
      wrapper: createWrapper(queryClient),
    });

    expect(mockFetchProjectsQuery).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });
});

describe("useProjectsWithError", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    mockFetchProjectsQuery.mockClear();
    mockGetProjectLoadErrorType.mockClear();
  });

  function createWrapper(client: QueryClient) {
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      );
    };
  }

  it("should return projects array on success", async () => {
    const mockData = {
      projects: [
        {
          id: "1",
          issue_number: 1,
          title: "Project 1",
          slug: "project-1",
          description: "First project",
          organization: {
            name: "Org 1",
            short_name: "O1",
            url: "https://example.com",
          },
          status: {
            state: "active" as const,
            usage: "experimental" as const,
            notes: "",
          },
          tags: [],
          media: { logo: "", images: [] },
          links: { homepage: "", repository: "", documentation: "" },
          timestamps: {
            created_at: "2024-01-01",
            last_updated_at: "2024-01-01",
          },
        },
      ],
    };

    mockFetchProjectsQuery.mockResolvedValue(mockData);

    const { result } = renderHook(() => useProjectsWithError(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.projects).toEqual(mockData.projects);
    expect(result.current.isError).toBe(false);
  });

  it("should return empty array on error", async () => {
    const mockError = new Error("Network error");
    mockGetProjectLoadErrorType.mockReturnValue("offline");
    mockFetchProjectsQuery.mockRejectedValue(mockError);

    const { result } = renderHook(
      () => useProjectsWithError({ retry: 0 }),
      {
        wrapper: createWrapper(queryClient),
      },
    );

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 3000,
    });

    expect(result.current.projects).toEqual([]);
    expect(result.current.error).toEqual(mockError);
    expect(result.current.errorType).toBe("offline");
    expect(result.current.isOfflineError).toBe(true);
    expect(result.current.errorMessage).toBe("Network error");
  });

  it("should classify AbortError as timeout error type", async () => {
    const abortError = new Error("The operation was aborted");
    abortError.name = "AbortError";
    mockFetchProjectsQuery.mockRejectedValue(abortError);
    mockGetProjectLoadErrorType.mockReturnValue("timeout");

    const { result } = renderHook(
      () => useProjectsWithError({ retry: 0 }),
      {
        wrapper: createWrapper(queryClient),
      },
    );

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 3000,
    });

    expect(result.current.errorType).toBe("timeout");
    expect(result.current.isOfflineError).toBe(false);
    expect(result.current.isRateLimitError).toBe(false);
  });

  it("should handle rate limit errors", async () => {
    const rateLimitError = new Error("API rate limit exceeded");
    mockFetchProjectsQuery.mockRejectedValue(rateLimitError);
    mockGetProjectLoadErrorType.mockReturnValue("rate-limit");

    const { result } = renderHook(
      () => useProjectsWithError({ retry: 0 }),
      {
        wrapper: createWrapper(queryClient),
      },
    );

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 3000,
    });

    expect(result.current.errorType).toBe("rate-limit");
    expect(result.current.isRateLimitError).toBe(true);
    expect(result.current.isOfflineError).toBe(false);
  });

  it("should handle slow responses gracefully", async () => {
    const mockData = {
      projects: [
        {
          id: "1",
          issue_number: 1,
          title: "Slow Project",
          slug: "slow-project",
          description: "A slow-loading project",
          organization: {
            name: "Test Org",
            short_name: "Test",
            url: "https://example.com",
          },
          status: {
            state: "active" as const,
            usage: "experimental" as const,
            notes: "",
          },
          tags: ["test"],
          media: {
            logo: "",
            images: [],
          },
          links: {
            homepage: "",
            repository: "",
            documentation: "",
          },
          timestamps: {
            created_at: "2024-01-01",
            last_updated_at: "2024-01-01",
          },
        },
      ],
    };

    mockFetchProjectsQuery.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(mockData), 100);
        }),
    );

    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(mockData);
    expect(result.current.isError).toBe(false);
  });

  it("should refetch after error when refetch is called", async () => {
    const mockData = {
      projects: [
        {
          id: "1",
          issue_number: 1,
          title: "Refetched Project",
          slug: "refetched-project",
          description: "A project loaded after refetch",
          organization: {
            name: "Test Org",
            short_name: "Test",
            url: "https://example.com",
          },
          status: {
            state: "active" as const,
            usage: "experimental" as const,
            notes: "",
          },
          tags: ["test"],
          media: {
            logo: "",
            images: [],
          },
          links: {
            homepage: "",
            repository: "",
            documentation: "",
          },
          timestamps: {
            created_at: "2024-01-01",
            last_updated_at: "2024-01-01",
          },
        },
      ],
    };

    const fetchError = new Error("Network failure");
    mockFetchProjectsQuery
      .mockRejectedValueOnce(fetchError)
      .mockResolvedValueOnce(mockData);
    mockGetProjectLoadErrorType.mockReturnValue("generic");

    const { result } = renderHook(
      () => useProjectsWithError({ retry: 0 }),
      {
        wrapper: createWrapper(queryClient),
      },
    );

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 3000,
    });

    expect(result.current.projects).toEqual([]);

    await result.current.refetch();

    await waitFor(() => expect(result.current.isError).toBe(false));
    expect(result.current.projects).toEqual(mockData.projects);
  });

  it("does not retry on rate-limit errors", async () => {
    const rateLimitError = new GitHubApiError("API rate limit exceeded", 403);
    mockFetchProjectsQuery.mockRejectedValue(rateLimitError);
    mockGetProjectLoadErrorType.mockReturnValue("rate-limit");

    const { result } = renderHook(
      () => useProjectsWithError({ retry: 3 }),
      {
        wrapper: createWrapper(queryClient),
      },
    );

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    });

    // Should only be called once — no retries for rate-limit errors
    expect(mockFetchProjectsQuery).toHaveBeenCalledTimes(1);
    expect(result.current.isRateLimitError).toBe(true);
  });
});
