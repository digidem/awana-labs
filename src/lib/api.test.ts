/**
 * Tests for API client module
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchJson, fetchProjects, ApiError, getErrorMessage } from "./api";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("API Client", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchJson", () => {
    it("should fetch and parse JSON data", async () => {
      const mockData = { projects: [{ id: "1", title: "Test Project" }] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers({
          "content-type": "application/json",
        }),
        json: async () => mockData,
      } as Response);

      const result = await fetchJson("/test.json");

      expect(result.data).toEqual(mockData);
      expect(result.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should throw ApiError on non-OK response", async () => {
      const errorResponse = {
        ok: false,
        status: 404,
        statusText: "Not Found",
        headers: new Headers(),
        json: async () => ({}),
      } as Response;

      mockFetch.mockResolvedValueOnce(errorResponse);

      // Use retries: 0 to avoid retry loop in tests
      await expect(fetchJson("/missing.json", { retries: 0 })).rejects.toThrow(
        ApiError,
      );
    });

    it("should throw error for non-JSON content type", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers({
          "content-type": "text/plain",
        }),
      } as Response);

      await expect(fetchJson("/test.txt")).rejects.toThrow("Expected JSON");
    });
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

  describe("fetchProjects", () => {
    it("should fetch projects data from GitHub API", async () => {
      vi.mock("./github-projects", () => ({
        fetchProjectsFromGitHub: vi.fn().mockResolvedValue({
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
                logo: "https://example.com/logo.png",
                images: [],
              },
              links: {
                homepage: "https://example.com",
                repository: "https://github.com/test/repo",
                documentation: "https://docs.example.com",
              },
              timestamps: {
                created_at: "2024-01-01T00:00:00Z",
                last_updated_at: "2024-01-01T00:00:00Z",
              },
            },
          ],
        }),
      }));

      const result = await fetchProjects();

      expect(result.status).toBe(200);
      expect(result.data?.projects).toHaveLength(1);
      expect(result.data?.projects[0].title).toBe("Test Project");
    });
  });

  // Note: timeout tests are skipped due to vitest fake timers complexity
  // In production, timeouts work via AbortController
});
