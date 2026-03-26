/**
 * Custom hook for fetching projects with TanStack Query
 *
 * This hook provides a clean interface for fetching projects with built-in
 * caching, refetching, and error handling.
 */

import { useQuery } from "@tanstack/react-query";
import {
  fetchProjectsQuery,
  getErrorMessage,
  getProjectLoadErrorType,
  PROJECTS_CACHE_MAX_AGE_MS,
  queryKeys,
} from "@/lib/api";
import type { ProjectsData } from "@/types/project";

interface UseProjectsOptions {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  retry?: number;
}

/**
 * Hook for fetching projects data.
 *
 * React Query caches within the current session, while the runtime fetcher
 * persists validated payloads in localStorage for reload and offline fallback.
 *
 * @param options - TanStack Query options
 * @returns Query result with projects data
 */
export function useProjects(options: UseProjectsOptions = {}) {
  const {
    enabled = true,
    staleTime = PROJECTS_CACHE_MAX_AGE_MS,
    gcTime = PROJECTS_CACHE_MAX_AGE_MS * 2,
    refetchOnWindowFocus = false,
    refetchOnReconnect = true,
    retry = 2,
  } = options;

  // Always uses GitHub API now
  const queryFn = fetchProjectsQuery;

  return useQuery<ProjectsData, Error>({
    queryKey: queryKeys.projects,
    queryFn,
    enabled,
    staleTime,
    gcTime,
    refetchOnWindowFocus,
    refetchOnReconnect,
    retry,
  });
}

/**
 * Hook for fetching projects with simplified error handling
 */
export function useProjectsWithError(options?: UseProjectsOptions) {
  const result = useProjects(options);
  const errorType = result.error ? getProjectLoadErrorType(result.error) : null;

  return {
    projects: result.data?.projects ?? [],
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.error,
    errorType,
    isOfflineError: errorType === "offline",
    errorMessage: result.error ? getErrorMessage(result.error) : null,
    refetch: result.refetch,
  };
}
