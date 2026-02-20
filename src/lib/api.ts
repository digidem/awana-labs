/**
 * API Client Module
 *
 * Centralized API client with proper TypeScript typing, error handling,
 * and TanStack Query integration for caching.
 */

import type {
  QueryFunction,
  QueryFunctionContext,
} from "@tanstack/react-query";

// =============================================================================
// Type Definitions
// =============================================================================

/** API response wrapper for consistent error handling */
export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

/** Custom API error class with additional context */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Generic fetch options */
export interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

// =============================================================================
// API Client Configuration
// =============================================================================

const DEFAULT_TIMEOUT = 10000; // 10 seconds
const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_DELAY = 1000; // 1 second

// =============================================================================
// Core Fetch Function
// =============================================================================

/**
 * Core fetch wrapper with timeout, retry logic, and error handling
 */
async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {},
): Promise<Response> {
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new ApiError(
          `API request failed: ${response.statusText}`,
          response.status,
          response.statusText,
        );
      }

      return response;
    } catch (error) {
      lastError = error as Error;

      // Don't retry on abort (timeout) or 4xx errors
      if (
        error instanceof Error &&
        (error.name === "AbortError" ||
          (error instanceof ApiError &&
            error.status >= 400 &&
            error.status < 500))
      ) {
        throw error;
      }

      // Wait before retrying (except on last attempt)
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw lastError || new Error("Unknown error occurred");
}

// =============================================================================
// Typed API Response Handlers
// =============================================================================

/**
 * Fetch JSON with full type safety and error handling
 */
export async function fetchJson<T>(
  url: string,
  options: FetchOptions = {},
): Promise<ApiResponse<T>> {
  const response = await fetchWithTimeout(url, options);

  // Validate content type
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new ApiError(
      `Expected JSON response, got: ${contentType}`,
      response.status,
      response.statusText,
    );
  }

  const data = await response.json();

  return {
    data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  };
}

/**
 * Fetch text with error handling
 */
export async function fetchText(
  url: string,
  options: FetchOptions = {},
): Promise<ApiResponse<string>> {
  const response = await fetchWithTimeout(url, options);

  const data = await response.text();

  return {
    data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  };
}

// =============================================================================
// TanStack Query Integration
// =============================================================================

/**
 * Create a typed QueryFunction for TanStack Query
 */
export function createQueryFunction<T>(
  fetcher: (url: string, options?: FetchOptions) => Promise<ApiResponse<T>>,
): QueryFunction<T, [string]> {
  return async (context: QueryFunctionContext<[string]>) => {
    const [url] = context.queryKey;
    const result = await fetcher(url);
    return result.data;
  };
}

// =============================================================================
// Project-Specific API Functions
// =============================================================================

import type { ProjectsData } from "@/types/project";

// =============================================================================
// GitHub API Configuration
// =============================================================================

// Flag to switch between static JSON and GitHub API
// Now defaults to true - GitHub API is the primary source
const USE_GITHUB_API = import.meta.env.VITE_USE_GITHUB_API !== "false";

/**
 * Fetch projects from GitHub API
 * Uses the GitHub client to fetch issues with 'publish:yes' label
 */
export async function fetchProjectsFromGitHub(
  token?: string,
): Promise<ApiResponse<ProjectsData>> {
  // Dynamic import to avoid issues when Octokit is not available
  const { fetchProjectsFromGitHub: fetchFromGitHub } = await import(
    "./github-projects"
  );

  const data = await fetchFromGitHub(
    import.meta.env.VITE_GITHUB_OWNER || "luandro",
    import.meta.env.VITE_GITHUB_REPO || "awana-labs-showcase",
    import.meta.env.VITE_GITHUB_LABEL || "publish:yes",
    token,
  );

  return {
    data,
    status: 200,
    statusText: "OK",
    headers: new Headers(),
  };
}

/**
 * Main fetch function - now always uses GitHub API
 * Set VITE_USE_GITHUB_API=false in .env to disable (not recommended)
 */
export async function fetchProjects(
  options?: FetchOptions,
): Promise<ApiResponse<ProjectsData>> {
  if (!USE_GITHUB_API) {
    throw new Error(
      "Static projects.json has been removed. Use VITE_USE_GITHUB_API=true",
    );
  }

  console.log("Using GitHub API for projects");
  try {
    return await fetchProjectsFromGitHub();
  } catch (error) {
    console.error("GitHub API error:", error);
    throw error;
  }
}

/**
 * TanStack Query function for fetching projects - uses GitHub API
 */
export const fetchProjectsQuery: QueryFunction<
  ProjectsData,
  ["projects"]
> = async () => {
  const result = await fetchProjects();
  return result.data;
};

// Query keys for TanStack Query
export const queryKeys = {
  projects: ["projects"] as const,
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Check if online/offline
 */
export function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

/**
 * Get a human-readable error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unknown error occurred";
}
