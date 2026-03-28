/**
 * GitHub API Client Module
 *
 * Centralized GitHub API client using Octokit with proper TypeScript typing
 * and error handling. Provides methods for interacting with GitHub's REST API.
 */

import { Octokit } from "@octokit/rest";

// =============================================================================
// Type Definitions
// =============================================================================

/** GitHub repository owner and name */
export interface GitHubRepo {
  owner: string;
  name: string;
}

/** GitHub issue data */
export interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  labels: string[];
  user: {
    login: string;
    type: string;
  };
}

/** GitHub repository data */
export interface GitHubRepository {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  pushed_at: string;
  default_branch: string;
}

/** GitHub rate limit status */
export interface GitHubRateLimit {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
}

function normalizeLabels(
  labels: Array<string | { name?: string | null }>,
): string[] {
  return labels
    .map((label) =>
      typeof label === "string" ? label : label.name ?? "",
    )
    .map((label) => label.trim())
    .filter((label): label is string => label.length > 0);
}

/** Custom GitHub API error class */
export class GitHubApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public documentation_url?: string,
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

/**
 * Check whether a thrown error is a GitHub rate-limit error.
 * Handles both wrapped {@link GitHubApiError} instances and raw Octokit errors.
 */
export function isRateLimitError(error: unknown): boolean {
  if (error instanceof GitHubApiError) {
    return (
      (error.status === 403 || error.status === 429) &&
      error.message.toLowerCase().includes("rate limit")
    );
  }
  // Fallback: duck-type check for raw Octokit / RequestError objects
  if (error && typeof error === "object") {
    const err = error as Record<string, unknown>;
    const status = err["status"];
    const message =
      typeof err["message"] === "string"
        ? (err["message"] as string).toLowerCase()
        : "";
    return (
      (status === 403 || status === 429) && message.includes("rate limit")
    );
  }
  return false;
}

// =============================================================================
// GitHub Client Class
// =============================================================================

/**
 * GitHub API client with Octokit
 * Provides typed methods for common GitHub operations
 */
export class GitHubClient {
  private octokit: Octokit;
  private userAgent: string;
  private token?: string;

  /**
   * Create a new GitHub client
   * @param token - GitHub personal access token (optional for public repos)
   * @param userAgent - User agent string for API requests
   */
  constructor(token?: string, userAgent = "awana-labs-showcase") {
    this.userAgent = userAgent;
    this.token = token;
    this.octokit = new Octokit({
      auth: token,
      userAgent,
    });
  }

  /**
   * Set authentication token
   * @param token - GitHub personal access token
   */
  setAuth(token: string): void {
    this.token = token;
    this.octokit = new Octokit({
      auth: token,
      userAgent: this.userAgent,
    });
  }

  /**
   * Check if client is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.token;
  }

  /**
   * Fetch issues from a repository
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param options - Fetch options (labels, state, etc.)
   */
  async getIssues(
    owner: string,
    repo: string,
    options: {
      labels?: string;
      state?: "open" | "closed" | "all";
      per_page?: number;
    } = {},
  ): Promise<GitHubIssue[]> {
    try {
      const allIssues: Array<{
        number: number;
        title: string;
        body?: string | null;
        state?: string;
        html_url: string;
        created_at: string;
        updated_at: string;
        labels: Array<string | { name?: string }>;
        user: { login: string; type: string } | null;
      }> = [];
      const iterator = this.octokit.paginate.iterator(
        this.octokit.rest.issues.listForRepo,
        {
          owner,
          repo,
          labels: options.labels,
          state: options.state || "open",
          per_page: options.per_page || 100,
        }
      );

      for await (const response of iterator) {
        allIssues.push(...(response.data as typeof allIssues));
      }

      return allIssues.map((issue) => ({
        number: issue.number,
        title: issue.title,
        body: issue.body || null,
        state: issue.state || "open",
        html_url: issue.html_url,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        labels: normalizeLabels(issue.labels),
        user: {
          login: issue.user?.login || "",
          type: issue.user?.type || "User",
        },
      }));
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Fetch a single issue by number
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param issueNumber - Issue number
   */
  async getIssue(
    owner: string,
    repo: string,
    issueNumber: number,
  ): Promise<GitHubIssue> {
    try {
      const response = await this.octokit.rest.issues.get({
        owner,
        repo,
        issue_number: issueNumber,
      });

      const issue = response.data;
      return {
        number: issue.number,
        title: issue.title,
        body: issue.body,
        state: issue.state || "open",
        html_url: issue.html_url,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        labels: normalizeLabels(issue.labels),
        user: {
          login: issue.user?.login || "",
          type: issue.user?.type || "User",
        },
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Fetch repository information
   * @param owner - Repository owner
   * @param repo - Repository name
   */
  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    try {
      const response = await this.octokit.rest.repos.get({
        owner,
        repo,
      });

      const data = response.data;
      return {
        name: data.name,
        full_name: data.full_name,
        description: data.description,
        html_url: data.html_url,
        stargazers_count: data.stargazers_count,
        forks_count: data.forks_count,
        open_issues_count: data.open_issues_count,
        language: data.language,
        pushed_at: data.pushed_at,
        default_branch: data.default_branch,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Check current rate limit status
   */
  async getRateLimit(): Promise<GitHubRateLimit> {
    try {
      const response = await this.octokit.rest.rateLimit.get();
      const { limit, remaining, reset, used } = response.data.resources.core;
      return { limit, remaining, reset, used };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle errors from Octokit
   */
  private handleError(error: unknown): GitHubApiError {
    if (error instanceof Error) {
      // Octokit errors often have status property
      const status = (error as { status?: number }).status || 500;
      const documentation_url = (error as { documentation_url?: string })
        .documentation_url;

      if (error.message.includes("Bad credentials")) {
        return new GitHubApiError(
          "GitHub API authentication failed. Please check your token.",
          status,
          documentation_url,
        );
      }

      if (error.message.includes("Not Found")) {
        return new GitHubApiError(
          "Repository or resource not found.",
          status,
          documentation_url,
        );
      }

      if (error.message.toLowerCase().includes("rate limit")) {
        return new GitHubApiError(
          "GitHub API rate limit exceeded. Please try again later.",
          status,
          documentation_url,
        );
      }

      return new GitHubApiError(error.message, status, documentation_url);
    }

    return new GitHubApiError("Unknown GitHub API error", 500);
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a GitHub client with optional token
 */
export function createGitHubClient(token?: string): GitHubClient {
  return new GitHubClient(token);
}

// =============================================================================
// Default Export
// =============================================================================

export default GitHubClient;
