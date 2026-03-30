/**
 * Tests for GitHub API client module
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GitHubClient, GitHubApiError, createGitHubClient, isRateLimitError } from "./github";

// Use vi.hoisted to properly mock Octokit
const { mockRest, MockOctokitClass, mockPaginateIterator } = vi.hoisted(() => {
  const mockRest = {
    issues: {
      listForRepo: vi.fn(),
      get: vi.fn(),
    },
    repos: {
      get: vi.fn(),
    },
    rateLimit: {
      get: vi.fn(),
    },
  };

  const mockPaginateIterator = vi.fn();

  // Create a constructor function that can be called with new
  const MockOctokitClass = function () {
    this.rest = mockRest;
    this.paginate = {
      iterator: mockPaginateIterator
    };
    this.auth = undefined;
  };

  return { mockRest, MockOctokitClass, mockPaginateIterator };
});

vi.mock("@octokit/rest", () => ({
  Octokit: MockOctokitClass,
}));

describe("GitHubClient", () => {
  let client: GitHubClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new GitHubClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create a client without token", () => {
      const client = new GitHubClient();
      expect(client).toBeDefined();
    });

    it("should create a client with token", () => {
      const client = new GitHubClient("test-token");
      expect(client).toBeDefined();
    });

    it("should use custom user agent", () => {
      const client = new GitHubClient(undefined, "custom-agent");
      expect(client).toBeDefined();
    });
  });

  describe("createGitHubClient factory", () => {
    it("should create a client without token", () => {
      const client = createGitHubClient();
      expect(client).toBeInstanceOf(GitHubClient);
    });

    it("should create a client with token", () => {
      const client = createGitHubClient("test-token");
      expect(client).toBeInstanceOf(GitHubClient);
    });
  });

  describe("isAuthenticated", () => {
    it("should return false when no token provided", () => {
      const client = new GitHubClient();
      expect(client.isAuthenticated()).toBe(false);
    });

    it("should return true when token provided", () => {
      const client = new GitHubClient("test-token");
      expect(client.isAuthenticated()).toBe(true);
    });
  });

  describe("getIssues", () => {
    it("should fetch issues from repository", async () => {
      const mockIssues = [
        {
          number: 1,
          title: "Test Issue",
          body: "Issue body",
          state: "open",
          html_url: "https://github.com/owner/repo/issues/1",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-02T00:00:00Z",
          labels: [{ name: "bug" }, { name: "enhancement" }],
          user: { login: "testuser", type: "User" },
        },
      ];

      mockPaginateIterator.mockReturnValue(
        (async function* () {
          yield { data: mockIssues };
        })()
      );

      const issues = await client.getIssues("owner", "repo");

      expect(issues).toHaveLength(1);
      expect(issues[0].number).toBe(1);
      expect(issues[0].title).toBe("Test Issue");
      expect(issues[0].labels).toEqual(["bug", "enhancement"]);
      expect(mockPaginateIterator).toHaveBeenCalledWith(
        mockRest.issues.listForRepo,
        {
          owner: "owner",
          repo: "repo",
          labels: undefined,
          state: "open",
          per_page: 100,
        }
      );
    });

    it("should pass labels filter", async () => {
      mockPaginateIterator.mockReturnValue(
        (async function* () {
          yield { data: [] };
        })()
      );

      await client.getIssues("owner", "repo", { labels: "publish:yes" });

      expect(mockPaginateIterator).toHaveBeenCalledWith(
        mockRest.issues.listForRepo,
        expect.objectContaining({
          labels: "publish:yes",
        }),
      );
    });

    it("should pass state filter", async () => {
      mockPaginateIterator.mockReturnValue(
        (async function* () {
          yield { data: [] };
        })()
      );

      await client.getIssues("owner", "repo", { state: "all" });

      expect(mockPaginateIterator).toHaveBeenCalledWith(
        mockRest.issues.listForRepo,
        expect.objectContaining({
          state: "all",
        }),
      );
    });

    it("filters pull requests out of the issues response", async () => {
      const mockIssues = [
        {
          number: 1,
          title: "Test Issue",
          body: "Issue body",
          state: "open",
          html_url: "https://github.com/owner/repo/issues/1",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-02T00:00:00Z",
          labels: [{ name: "bug" }],
          user: { login: "testuser", type: "User" },
        },
        {
          number: 2,
          title: "Test Pull Request",
          body: "PR body",
          state: "open",
          html_url: "https://github.com/owner/repo/pull/2",
          created_at: "2024-01-03T00:00:00Z",
          updated_at: "2024-01-04T00:00:00Z",
          labels: [{ name: "enhancement" }],
          user: { login: "testuser", type: "User" },
          pull_request: { url: "https://api.github.com/repos/owner/repo/pulls/2" },
        },
      ];

      mockPaginateIterator.mockReturnValue(
        (async function* () {
          yield { data: mockIssues };
        })()
      );

      const issues = await client.getIssues("owner", "repo");

      expect(issues).toHaveLength(1);
      expect(issues[0].number).toBe(1);
      expect(issues[0].title).toBe("Test Issue");
    });

    it("should handle API errors", async () => {
      mockPaginateIterator.mockImplementation(() => {
        throw new Error("Bad credentials");
      });

      await expect(client.getIssues("owner", "repo")).rejects.toThrow(
        GitHubApiError,
      );
    });
  });

  describe("getIssue", () => {
    it("should fetch a single issue", async () => {
      const mockIssue = {
        number: 1,
        title: "Test Issue",
        body: "Issue body",
        state: "open",
        html_url: "https://github.com/owner/repo/issues/1",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-02T00:00:00Z",
        labels: [{ name: "bug" }],
        user: { login: "testuser", type: "User" },
      };

      mockRest.issues.get.mockResolvedValue({
        data: mockIssue,
      });

      const issue = await client.getIssue("owner", "repo", 1);

      expect(issue.number).toBe(1);
      expect(issue.title).toBe("Test Issue");
      expect(mockRest.issues.get).toHaveBeenCalledWith({
        owner: "owner",
        repo: "repo",
        issue_number: 1,
      });
    });

    it("should handle API errors for single issue", async () => {
      mockRest.issues.get.mockRejectedValue(new Error("Not Found"));

      await expect(client.getIssue("owner", "repo", 999)).rejects.toThrow(
        GitHubApiError,
      );
    });
  });

  describe("getRepository", () => {
    it("should fetch repository information", async () => {
      const mockRepo = {
        name: "test-repo",
        full_name: "owner/test-repo",
        description: "A test repository",
        html_url: "https://github.com/owner/test-repo",
        stargazers_count: 100,
        forks_count: 20,
        open_issues_count: 5,
        language: "TypeScript",
        pushed_at: "2024-01-01T00:00:00Z",
        default_branch: "main",
      };

      mockRest.repos.get.mockResolvedValue({
        data: mockRepo,
      });

      const repo = await client.getRepository("owner", "test-repo");

      expect(repo.name).toBe("test-repo");
      expect(repo.full_name).toBe("owner/test-repo");
      expect(repo.stargazers_count).toBe(100);
      expect(repo.language).toBe("TypeScript");
    });

    it("should handle API errors", async () => {
      mockRest.repos.get.mockRejectedValue(
        new Error("Not Found"),
      );

      await expect(
        client.getRepository("owner", "nonexistent"),
      ).rejects.toThrow(GitHubApiError);
    });
  });

  describe("getRateLimit", () => {
    it("should fetch rate limit status", async () => {
      const mockRateLimit = {
        resources: {
          core: {
            limit: 5000,
            remaining: 4999,
            reset: 1704067200,
            used: 1,
          },
        },
      };

      mockRest.rateLimit.get.mockResolvedValue({
        data: mockRateLimit,
      });

      const rateLimit = await client.getRateLimit();

      expect(rateLimit.limit).toBe(5000);
      expect(rateLimit.remaining).toBe(4999);
      expect(rateLimit.used).toBe(1);
    });

    it("should handle API errors", async () => {
      mockRest.rateLimit.get.mockRejectedValue(
        new Error("Rate limit error"),
      );

      await expect(client.getRateLimit()).rejects.toThrow(GitHubApiError);
    });
  });

  describe("error handling", () => {
    it("should throw GitHubApiError with correct status for bad credentials", async () => {
      mockPaginateIterator.mockImplementation(() => {
        throw Object.assign(new Error("Bad credentials"), { status: 401 });
      });

      await expect(client.getIssues("owner", "repo")).rejects.toThrow(
        "GitHub API authentication failed",
      );
    });

    it("should throw GitHubApiError for not found", async () => {
      mockPaginateIterator.mockImplementation(() => {
        throw Object.assign(new Error("Not Found"), { status: 404 });
      });

      await expect(client.getIssues("owner", "repo")).rejects.toThrow(
        "Repository or resource not found",
      );
    });

    it("should throw GitHubApiError for rate limit", async () => {
      mockPaginateIterator.mockImplementation(() => {
        throw Object.assign(new Error("Rate limit exceeded"), { status: 403 });
      });

      await expect(client.getIssues("owner", "repo")).rejects.toThrow(
        "GitHub API rate limit exceeded",
      );
    });
  });
});

describe("GitHubApiError", () => {
  it("should create error with message and status", () => {
    const error = new GitHubApiError("Test error", 500);

    expect(error.message).toBe("Test error");
    expect(error.status).toBe(500);
    expect(error.name).toBe("GitHubApiError");
  });

  it("should include documentation URL when provided", () => {
    const error = new GitHubApiError("Test error", 404, "https://docs.github.com");

    expect(error.documentation_url).toBe("https://docs.github.com");
  });
});

describe("isRateLimitError", () => {
  it("returns true for GitHubApiError with status 403 and 'rate limit' in message", () => {
    const error = new GitHubApiError("API rate limit exceeded", 403);
    expect(isRateLimitError(error)).toBe(true);
  });

  it("returns true for GitHubApiError with status 403 and 'Rate Limit' (case-insensitive)", () => {
    const error = new GitHubApiError("Rate Limit Exceeded", 403);
    expect(isRateLimitError(error)).toBe(true);
  });

  it("returns false for GitHubApiError with status 403 but no 'rate limit' in message", () => {
    const error = new GitHubApiError("Forbidden access", 403);
    expect(isRateLimitError(error)).toBe(false);
  });

  it("returns false for GitHubApiError with status 404", () => {
    const error = new GitHubApiError("Not Found", 404);
    expect(isRateLimitError(error)).toBe(false);
  });

  it("returns true for duck-typed object with status 429 and 'rate limit' in message", () => {
    const error = { status: 429, message: "rate limit exceeded" };
    expect(isRateLimitError(error)).toBe(true);
  });

  it("returns false for duck-typed object with status 404 and no 'rate limit' in message", () => {
    const error = { status: 404, message: "not found" };
    expect(isRateLimitError(error)).toBe(false);
  });

  it("returns false for duck-typed object with status 403 but non-string message", () => {
    const error = { status: 403, message: 12345 };
    expect(isRateLimitError(error)).toBe(false);
  });

  it("returns false for null", () => {
    expect(isRateLimitError(null)).toBe(false);
  });

  it("returns false for a string", () => {
    expect(isRateLimitError("rate limit error")).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isRateLimitError(undefined)).toBe(false);
  });

  it("returns false for a number", () => {
    expect(isRateLimitError(42)).toBe(false);
  });
});
