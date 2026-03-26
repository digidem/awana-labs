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
import { parseProjectsData, type ProjectsData } from "@/types/project.schema";
import { fetchValidatedProjectsFromGitHub } from "./github-projects";

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
// Project Runtime Data Contract
// =============================================================================

export const PROJECTS_CACHE_KEY = "awana-labs-projects-cache";
export const PROJECTS_CACHE_VERSION = 1;
export const PROJECTS_CACHE_MAX_AGE_MS = 1000 * 60 * 60;

export interface ProjectsCacheEntry {
  version: number;
  cachedAt: string;
  data: ProjectsData;
}

interface CachedProjectsResult {
  entry: ProjectsCacheEntry;
  isStale: boolean;
}

function getProjectsStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch (error) {
    console.warn("Projects cache is unavailable:", error);
    return null;
  }
}

function parseProjectsCacheEntry(value: unknown): ProjectsCacheEntry {
  if (!value || typeof value !== "object") {
    throw new Error("Projects cache entry must be an object");
  }

  const cacheRecord = value as Record<string, unknown>;

  if (cacheRecord.version !== PROJECTS_CACHE_VERSION) {
    throw new Error("Projects cache version mismatch");
  }

  if (typeof cacheRecord.cachedAt !== "string") {
    throw new Error("Projects cache is missing cachedAt");
  }

  const cachedAtMs = Date.parse(cacheRecord.cachedAt);
  if (Number.isNaN(cachedAtMs)) {
    throw new Error("Projects cache has an invalid cachedAt timestamp");
  }

  return {
    version: PROJECTS_CACHE_VERSION,
    cachedAt: new Date(cachedAtMs).toISOString(),
    data: parseProjectsData(cacheRecord.data),
  };
}

export function getProjectsCacheAgeMs(cachedAt: string): number {
  return Date.now() - Date.parse(cachedAt);
}

export function readProjectsCache(): CachedProjectsResult | null {
  const storage = getProjectsStorage();
  if (!storage) {
    return null;
  }

  const rawValue = storage.getItem(PROJECTS_CACHE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue);
    const entry = parseProjectsCacheEntry(parsed);

    return {
      entry,
      isStale: getProjectsCacheAgeMs(entry.cachedAt) > PROJECTS_CACHE_MAX_AGE_MS,
    };
  } catch (error) {
    console.warn("Discarding invalid projects cache entry:", error);
    storage.removeItem(PROJECTS_CACHE_KEY);
    return null;
  }
}

export function writeProjectsCache(data: ProjectsData): ProjectsCacheEntry | null {
  const storage = getProjectsStorage();
  if (!storage) {
    return null;
  }

  const entry: ProjectsCacheEntry = {
    version: PROJECTS_CACHE_VERSION,
    cachedAt: new Date().toISOString(),
    data: parseProjectsData(data),
  };

  try {
    storage.setItem(PROJECTS_CACHE_KEY, JSON.stringify(entry));
  } catch (error) {
    console.warn("Failed to persist projects cache:", error);
  }

  return entry;
}

export function clearProjectsCache(): void {
  const storage = getProjectsStorage();
  storage?.removeItem(PROJECTS_CACHE_KEY);
}

function createProjectsResponse(
  data: ProjectsData,
  source: "github" | "cache",
  stale = false,
): ApiResponse<ProjectsData> {
  return {
    data,
    status: 200,
    statusText:
      source === "cache"
        ? stale
          ? "OK (stale cache)"
          : "OK (cache)"
        : "OK",
    headers: new Headers({
      "x-awana-projects-source": source,
      "x-awana-projects-cache-stale": String(stale),
    }),
  };
}

/**
 * Fetch projects from GitHub API
 * Uses the GitHub client to fetch issues with 'publish:yes' label
 * and validates the response before it can reach the UI or cache.
 */
export async function fetchProjectsFromGitHub(
  token?: string,
): Promise<ApiResponse<ProjectsData>> {
  const data = await fetchValidatedProjectsFromGitHub(
    import.meta.env.VITE_GITHUB_OWNER || "luandro",
    import.meta.env.VITE_GITHUB_REPO || "awana-labs-showcase",
    import.meta.env.VITE_GITHUB_LABEL || "publish:yes",
    token,
  );

  writeProjectsCache(data);
  return createProjectsResponse(data, "github");
}

/**
 * Main fetch function for project data.
 *
 * Runtime contract:
 * - Fetch from GitHub on cold start when no valid cache exists.
 * - Validate payloads before they reach React Query or localStorage.
 * - Reuse localStorage when the cached payload is still fresh.
 * - Fall back to cached data when offline or when a refresh fails.
 */
export async function fetchProjects(): Promise<ApiResponse<ProjectsData>> {
  const cachedProjects = readProjectsCache();
  const online = isOnline();

  if (cachedProjects && (!cachedProjects.isStale || !online)) {
    return createProjectsResponse(
      cachedProjects.entry.data,
      "cache",
      cachedProjects.isStale,
    );
  }

  if (!online) {
    throw new ApiError(
      "You appear to be offline and no cached projects are available.",
      0,
      "Offline",
    );
  }

  try {
    return await fetchProjectsFromGitHub();
  } catch (error) {
    if (cachedProjects) {
      console.warn("Using cached projects after GitHub refresh failed:", error);
      return createProjectsResponse(cachedProjects.entry.data, "cache", true);
    }

    console.error("GitHub API error:", error);
    throw error;
  }
}

/**
 * TanStack Query function for fetching projects.
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
