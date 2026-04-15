/**
 * Tests for API client module
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as githubProjects from "./github-projects";
import {
  fetchProjects,
  ApiError,
  getErrorMessage,
  PROJECTS_CACHE_KEY,
  PROJECTS_CACHE_VERSION,
  deduplicateProjects,
} from "./api";

function createProjectsData() {
  return {
    projects: [
      {
        id: "test-project",
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
          logo: "https://example.com/logo.png",
          images: ["https://example.com/image.png"],
        },
        links: {
          homepage: "https://example.com",
          repository: "https://github.com/test/repo",
          documentation: "https://docs.example.com",
        },
        timestamps: {
          created_at: "2024-01-01T00:00:00.000Z",
          last_updated_at: "2024-01-02T00:00:00.000Z",
        },
      },
    ],
  };
}

describe("API Client", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("ApiError", () => {
    it("should create error with status and status text", () => {
      const error = new ApiError("Test error", 500, "Internal Server Error");

      expect(error.message).toBe("Test error");
      expect(error.status).toBe(500);
      expect(error.statusText).toBe("Internal Server Error");
      expect(error.name).toBe("ApiError");
    });

    it("should include additional data", () => {
      const data = { code: "ERR_001" };
      const error = new ApiError("Test error", 400, "Bad Request", data);

      expect(error.data).toEqual(data);
    });
  });

  describe("getErrorMessage", () => {
    it("should return message from ApiError", () => {
      const error = new ApiError("API failed", 500, "Server Error");
      expect(getErrorMessage(error)).toBe("API failed");
    });

    it("should return message from generic Error", () => {
      const error = new Error("Generic error");
      expect(getErrorMessage(error)).toBe("Generic error");
    });

    it("should return default message for unknown errors", () => {
      expect(getErrorMessage("string error")).toBe("An unknown error occurred");
      expect(getErrorMessage(null)).toBe("An unknown error occurred");
      expect(getErrorMessage(undefined)).toBe("An unknown error occurred");
    });
  });

  describe("deduplicateProjects", () => {
    it("removes duplicate slugs keeping the most recently updated", () => {
      const projects = [
        {
          ...createProjectsData().projects[0],
          slug: "comapeo-local-server",
          title: "CoMapeo Local Server (new)",
          timestamps: {
            created_at: "2024-01-01T00:00:00.000Z",
            last_updated_at: "2024-06-01T00:00:00.000Z",
          },
        },
        {
          ...createProjectsData().projects[0],
          slug: "comapeo-local-server",
          title: "CoMapeo Local Server (old)",
          timestamps: {
            created_at: "2024-01-01T00:00:00.000Z",
            last_updated_at: "2024-03-01T00:00:00.000Z",
          },
        },
        {
          ...createProjectsData().projects[0],
          slug: "unique-project",
          title: "Unique Project",
          timestamps: {
            created_at: "2024-01-01T00:00:00.000Z",
            last_updated_at: "2024-04-01T00:00:00.000Z",
          },
        },
      ];

      const result = deduplicateProjects(projects);

      expect(result).toHaveLength(2);
      expect(result.map((p) => p.slug).sort()).toEqual([
        "comapeo-local-server",
        "unique-project",
      ]);
      const comapeo = result.find((p) => p.slug === "comapeo-local-server")!;
      expect(comapeo.title).toBe("CoMapeo Local Server (new)");
    });

    it("returns all projects when there are no duplicates", () => {
      const projects = [
        { ...createProjectsData().projects[0], slug: "project-a" },
        { ...createProjectsData().projects[0], slug: "project-b" },
      ];

      expect(deduplicateProjects(projects)).toHaveLength(2);
    });
  });

  describe("fetchProjects", () => {
    it("fetches validated project data from GitHub on cold start", async () => {
      const mockData = createProjectsData();
      const fetchValidatedProjectsFromGitHub = vi
        .spyOn(githubProjects, "fetchValidatedProjectsFromGitHub")
        .mockResolvedValue(mockData);

      const result = await fetchProjects();

      expect(result.projects).toEqual(mockData.projects);
      expect(fetchValidatedProjectsFromGitHub).toHaveBeenCalledTimes(1);

      const cached = localStorage.getItem(PROJECTS_CACHE_KEY);
      expect(cached).not.toBeNull();
    });

    it("serves stale cache on rate-limit error", async () => {
      const mockData = createProjectsData();

      // Prime the cache with valid data
      localStorage.setItem(
        PROJECTS_CACHE_KEY,
        JSON.stringify({
          version: PROJECTS_CACHE_VERSION,
          cachedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h old
          data: mockData,
        }),
      );

      vi.spyOn(
        githubProjects,
        "fetchValidatedProjectsFromGitHub",
      ).mockRejectedValue(
        Object.assign(new Error("API rate limit exceeded"), { status: 403 }),
      );

      const result = await fetchProjects();

      // Should return cached data, not throw
      expect(result.projects).toEqual(mockData.projects);
    });
  });
});
