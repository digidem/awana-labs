/**
 * Custom hook for fetching projects with TanStack Query
 *
 * This hook provides a clean interface for fetching projects with built-in
 * caching, refetching, and error handling.
 */

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchProjectsQuery,
  getErrorMessage,
  getProjectLoadErrorType,
  PROJECTS_CACHE_MAX_AGE_MS,
  PROJECTS_DATA_UPDATED_EVENT,
  queryKeys,
  readProjectsCache,
  deduplicateProjects,
} from "@/lib/api";
import { isRateLimitError as isGitHubRateLimitError } from "@/lib/github";
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
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleProjectsDataUpdated = (event: Event) => {
      const { detail } = event as CustomEvent<ProjectsData>;
      if (!detail) {
        return;
      }

      queryClient.setQueryData(queryKeys.projects, detail);
    };

    window.addEventListener(
      PROJECTS_DATA_UPDATED_EVENT,
      handleProjectsDataUpdated as EventListener,
    );

    return () => {
      window.removeEventListener(
        PROJECTS_DATA_UPDATED_EVENT,
        handleProjectsDataUpdated as EventListener,
      );
    };
  }, [queryClient]);

  return useQuery<ProjectsData, Error, ProjectsData, readonly ["projects"]>({
    queryKey: queryKeys.projects,
    queryFn,
    enabled,
    staleTime,
    gcTime,
    refetchOnWindowFocus,
    refetchOnReconnect,
    placeholderData: () => {
      const cached = readProjectsCache();
      if (!cached) return undefined;
      return { projects: deduplicateProjects(cached.entry.data.projects) };
    },
    retry: (failureCount, error) => {
      // Never retry rate-limit errors — they won't resolve until the reset window passes
      if (isGitHubRateLimitError(error)) return false;
      return failureCount < retry;
    },
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
    isLoading: result.data === undefined && result.isFetching,
    isFetching: result.isFetching,
    isPlaceholderData: result.isPlaceholderData as boolean,
    isError: result.isError,
    error: result.error,
    errorType,
    isOfflineError: errorType === "offline",
    isRateLimitError: errorType === "rate-limit",
    errorMessage: result.error ? getErrorMessage(result.error) : null,
    refetch: result.refetch,
  };
}
