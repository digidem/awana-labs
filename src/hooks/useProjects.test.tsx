/**
 * Tests for useProjects hook
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useProjects, useProjectsWithError } from "./useProjects";
import * as api from "@/lib/api";

// Mock the API module
vi.mock("@/lib/api", () => ({
  PROJECTS_CACHE_MAX_AGE_MS: 60 * 60 * 1000,
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
});
