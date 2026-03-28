/**
 * API Client Module
 *
 * Centralized API client with proper TypeScript typing, error handling,
 * and TanStack Query integration for caching.
 */

import type { QueryFunction } from "@tanstack/react-query";
import { parseProjectsData, type ProjectsData } from "@/types/project.schema";
import { fetchValidatedProjectsFromGitHub } from "./github-projects";
import { isRateLimitError as isGitHubRateLimitError } from "./github";

// =============================================================================
// Type Definitions
// =============================================================================

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

export type ProjectLoadErrorType = "offline" | "timeout" | "rate-limit" | "generic";

// =============================================================================
// Project Runtime Data Contract
// =============================================================================

export const PROJECTS_CACHE_KEY = "awana-labs-projects-cache";
export const PROJECTS_CACHE_VERSION = 1;
export const PROJECTS_CACHE_MAX_AGE_MS = 1000 * 60 * 60;
/** Stale-while-revalidate upper bound: serve stale cache up to 24 hours old. */
export const PROJECTS_STALE_WINDOW_MS = 1000 * 60 * 60 * 24;
export const MAX_CACHE_SIZE_BYTES = 4 * 1024 * 1024; // 4MB safety margin under 5MB limit
export const MAX_CACHE_PROJECT_COUNT = 200;

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

function estimateEntrySizeBytes(entry: ProjectsCacheEntry): number {
  return new Blob([JSON.stringify(entry)]).size;
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

  if (new Blob([rawValue]).size > MAX_CACHE_SIZE_BYTES) {
    console.warn("Discarding projects cache entry that exceeds size limit");
    storage.removeItem(PROJECTS_CACHE_KEY);
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

  let validatedData = parseProjectsData(data);

  // Truncate to most recent projects if count exceeds the safeguard
  if (validatedData.projects.length > MAX_CACHE_PROJECT_COUNT) {
    const sorted = [...validatedData.projects].sort((a, b) => {
      const aTime = Date.parse(a.timestamps.last_updated_at);
      const bTime = Date.parse(b.timestamps.last_updated_at);
      return bTime - aTime;
    });
    validatedData = { ...validatedData, projects: sorted.slice(0, MAX_CACHE_PROJECT_COUNT) };
  }

  const entry: ProjectsCacheEntry = {
    version: PROJECTS_CACHE_VERSION,
    cachedAt: new Date().toISOString(),
    data: validatedData,
  };

  // Progressively remove oldest projects until the serialized entry fits
  while (estimateEntrySizeBytes(entry) > MAX_CACHE_SIZE_BYTES) {
    if (entry.data.projects.length === 0) {
      console.warn(
        "Projects cache still exceeds size limit after removing all projects; skipping write",
      );
      return null;
    }
    const trimmed = [...entry.data.projects];
    trimmed.sort((a, b) => {
      const aTime = Date.parse(a.timestamps.last_updated_at);
      const bTime = Date.parse(b.timestamps.last_updated_at);
      return aTime - bTime;
    });
    trimmed.shift();
    entry.data = { ...entry.data, projects: trimmed };
  }

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

/**
 * Fetch projects from GitHub API
 * Uses the GitHub client to fetch issues with 'publish:yes' label
 * and validates the response before it can reach the UI or cache.
 */
export async function fetchProjectsFromGitHub(
  token?: string,
): Promise<ProjectsData> {
  const data = await fetchValidatedProjectsFromGitHub(
    import.meta.env.VITE_GITHUB_OWNER || "luandro",
    import.meta.env.VITE_GITHUB_REPO || "awana-labs-showcase",
    import.meta.env.VITE_GITHUB_LABEL || "publish:yes",
    token,
  );

  writeProjectsCache(data);
  return data;
}

/**
 * Check whether a cached entry falls within the stale-while-revalidate window
 * (older than the fresh threshold but newer than the 24-hour upper bound).
 */
function isWithinStaleWindow(cachedAt: string): boolean {
  const ageMs = getProjectsCacheAgeMs(cachedAt);
  return ageMs > PROJECTS_CACHE_MAX_AGE_MS && ageMs <= PROJECTS_STALE_WINDOW_MS;
}

/** Resolved GitHub token from the Vite environment, or undefined. */
function getGitHubToken(): string | undefined {
  return import.meta.env.VITE_GITHUB_TOKEN || undefined;
}

/**
 * Main fetch function for project data.
 *
 * Runtime contract:
 * - Fetch from GitHub on cold start when no valid cache exists.
 * - Validate payloads before they reach React Query or localStorage.
 * - Reuse localStorage when the cached payload is still fresh.
 * - Stale-while-revalidate: serve cache between 1h-24h and refresh in background.
 * - Fall back to cached data when offline or when a refresh fails.
 */
export async function fetchProjects(): Promise<ProjectsData> {
  const cachedProjects = readProjectsCache();
  const online = isOnline();

  if (cachedProjects && (!cachedProjects.isStale || !online)) {
    return cachedProjects.entry.data;
  }

  // Stale-while-revalidate: if cache is between 1h and 24h old, serve it
  // immediately and kick off a background refresh.
  if (cachedProjects && online && isWithinStaleWindow(cachedProjects.entry.cachedAt)) {
    // Fire-and-forget background refresh
    fetchProjectsFromGitHub(getGitHubToken()).catch((error: unknown) => {
      console.warn("Background refresh failed:", error);
    });
    return cachedProjects.entry.data;
  }

  if (!online) {
    throw new ApiError(
      "You appear to be offline and no cached projects are available.",
      0,
      "Offline",
    );
  }

  try {
    return await fetchProjectsFromGitHub(getGitHubToken());
  } catch (error) {
    if (cachedProjects) {
      console.warn("Using cached projects after GitHub refresh failed:", error);
      return cachedProjects.entry.data;
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
  return await fetchProjects();
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

export function getProjectLoadErrorType(error: unknown): ProjectLoadErrorType {
  if (error instanceof ApiError && error.status === 0) {
    return "offline";
  }

  if (!isOnline()) {
    return "offline";
  }

  if (isGitHubRateLimitError(error)) {
    return "rate-limit";
  }

  if (
    error instanceof Error &&
    (error.name === "AbortError" || /timeout/i.test(error.message))
  ) {
    return "timeout";
  }

  return "generic";
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
