import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as githubProjects from "./github-projects";
import {
  fetchProjects,
  MAX_CACHE_SIZE_BYTES,
  PROJECTS_CACHE_KEY,
  PROJECTS_CACHE_MAX_AGE_MS,
  PROJECTS_CACHE_VERSION,
  PROJECTS_DATA_UPDATED_EVENT,
  readProjectsCache,
  writeProjectsCache,
} from "./api";
import { createMockProjectsData } from "@/test/fixtures";
import { setOnlineStatus } from "@/test/helpers";

function writeRawCache(data: unknown, cachedAt = new Date().toISOString()) {
  localStorage.setItem(
    PROJECTS_CACHE_KEY,
    JSON.stringify({
      version: PROJECTS_CACHE_VERSION,
      cachedAt,
      data,
    }),
  );
}

describe("projects cache contract", () => {
  beforeEach(() => {
    localStorage.clear();
    setOnlineStatus(true);
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches from GitHub on cache miss", async () => {
    const mockData = createMockProjectsData();
    const fetchValidatedProjectsFromGitHub = vi
      .spyOn(githubProjects, "fetchValidatedProjectsFromGitHub")
      .mockResolvedValue(mockData);

    const result = await fetchProjects();

    expect(fetchValidatedProjectsFromGitHub).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockData);
  });

  it("writes validated GitHub payloads to localStorage", async () => {
    const mockData = createMockProjectsData();
    vi.spyOn(
      githubProjects,
      "fetchValidatedProjectsFromGitHub",
    ).mockResolvedValue(mockData);

    await fetchProjects();

    const cached = readProjectsCache();
    expect(cached).not.toBeNull();
    expect(cached?.entry.version).toBe(PROJECTS_CACHE_VERSION);
    expect(cached?.entry.data).toEqual(mockData);
    expect(cached?.isStale).toBe(false);
  });

  it("reuses a fresh validated cache entry without refetching", async () => {
    const mockData = createMockProjectsData();
    writeProjectsCache(mockData);
    const fetchValidatedProjectsFromGitHub = vi.spyOn(
      githubProjects,
      "fetchValidatedProjectsFromGitHub",
    );

    const result = await fetchProjects();

    expect(fetchValidatedProjectsFromGitHub).not.toHaveBeenCalled();
    expect(result).toEqual(mockData);
  });

  it("rejects invalid cached payloads and replaces them with fresh data", async () => {
    const mockData = createMockProjectsData();
    writeRawCache({
      projects: [{ id: "broken-project" }],
    });
    const fetchValidatedProjectsFromGitHub = vi
      .spyOn(githubProjects, "fetchValidatedProjectsFromGitHub")
      .mockResolvedValue(mockData);

    await fetchProjects();

    expect(fetchValidatedProjectsFromGitHub).toHaveBeenCalledTimes(1);
    expect(readProjectsCache()?.entry.data).toEqual(mockData);
  });

  it("falls back to cached projects while offline", async () => {
    const mockData = createMockProjectsData();
    writeRawCache(
      mockData,
      new Date(Date.now() - PROJECTS_CACHE_MAX_AGE_MS - 1000).toISOString(),
    );
    setOnlineStatus(false);
    const fetchValidatedProjectsFromGitHub = vi.spyOn(
      githubProjects,
      "fetchValidatedProjectsFromGitHub",
    );

    const result = await fetchProjects();

    expect(fetchValidatedProjectsFromGitHub).not.toHaveBeenCalled();
    expect(result).toEqual(mockData);
  });

  it("dispatches an update event after refreshing stale cached projects", async () => {
    const mockData = createMockProjectsData();
    writeRawCache(
      mockData,
      new Date(Date.now() - PROJECTS_CACHE_MAX_AGE_MS - 1000).toISOString(),
    );
    const refreshedData = {
      projects: [
        {
          ...mockData.projects[0],
          title: "Refreshed Project",
          slug: "refreshed-project",
          id: "refreshed-project",
        },
      ],
    };
    vi.spyOn(
      githubProjects,
      "fetchValidatedProjectsFromGitHub",
    ).mockResolvedValue(refreshedData);
    const updatedListener = vi.fn();
    window.addEventListener(PROJECTS_DATA_UPDATED_EVENT, updatedListener);

    const result = await fetchProjects();

    expect(result).toEqual(mockData);

    await vi.waitFor(() => {
      expect(updatedListener).toHaveBeenCalledTimes(1);
    });

    const event = updatedListener.mock.calls[0][0] as CustomEvent;
    expect(event.detail).toEqual(refreshedData);
    expect(readProjectsCache()?.entry.data).toEqual(refreshedData);

    window.removeEventListener(PROJECTS_DATA_UPDATED_EVENT, updatedListener);
  });

  it("falls back to stale cached projects when a refresh fails", async () => {
    const mockData = createMockProjectsData();
    writeRawCache(
      mockData,
      new Date(Date.now() - PROJECTS_CACHE_MAX_AGE_MS - 1000).toISOString(),
    );
    const fetchValidatedProjectsFromGitHub = vi
      .spyOn(githubProjects, "fetchValidatedProjectsFromGitHub")
      .mockRejectedValue(new Error("GitHub unavailable"));

    const result = await fetchProjects();

    expect(fetchValidatedProjectsFromGitHub).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockData);
  });
});

describe("corrupted cache edge cases", () => {
  beforeEach(() => {
    localStorage.clear();
    setOnlineStatus(true);
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("discards non-JSON string in localStorage and refetches", async () => {
    localStorage.setItem(PROJECTS_CACHE_KEY, "{invalid json");
    const mockData = createMockProjectsData();
    const fetchValidatedProjectsFromGitHub = vi
      .spyOn(githubProjects, "fetchValidatedProjectsFromGitHub")
      .mockResolvedValue(mockData);

    const result = await fetchProjects();

    expect(fetchValidatedProjectsFromGitHub).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockData);
  });

  it("discards cache entry with wrong version and refetches", async () => {
    localStorage.setItem(
      PROJECTS_CACHE_KEY,
      JSON.stringify({
        version: 999,
        cachedAt: new Date().toISOString(),
        data: createMockProjectsData(),
      }),
    );
    const mockData = createMockProjectsData();
    const fetchValidatedProjectsFromGitHub = vi
      .spyOn(githubProjects, "fetchValidatedProjectsFromGitHub")
      .mockResolvedValue(mockData);

    const result = await fetchProjects();

    expect(fetchValidatedProjectsFromGitHub).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockData);
  });

  it("discards cache entry missing cachedAt field and refetches", async () => {
    localStorage.setItem(
      PROJECTS_CACHE_KEY,
      JSON.stringify({
        version: PROJECTS_CACHE_VERSION,
        data: createMockProjectsData(),
      }),
    );
    const mockData = createMockProjectsData();
    const fetchValidatedProjectsFromGitHub = vi
      .spyOn(githubProjects, "fetchValidatedProjectsFromGitHub")
      .mockResolvedValue(mockData);

    const result = await fetchProjects();

    expect(fetchValidatedProjectsFromGitHub).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockData);
  });

  it("discards cache entry with invalid cachedAt timestamp and refetches", async () => {
    localStorage.setItem(
      PROJECTS_CACHE_KEY,
      JSON.stringify({
        version: PROJECTS_CACHE_VERSION,
        cachedAt: "not-a-date",
        data: createMockProjectsData(),
      }),
    );
    const mockData = createMockProjectsData();
    const fetchValidatedProjectsFromGitHub = vi
      .spyOn(githubProjects, "fetchValidatedProjectsFromGitHub")
      .mockResolvedValue(mockData);

    const result = await fetchProjects();

    expect(fetchValidatedProjectsFromGitHub).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockData);
  });

  it("discards cache entry exceeding MAX_CACHE_SIZE_BYTES and refetches", async () => {
    const oversizedData = {
      version: PROJECTS_CACHE_VERSION,
      cachedAt: new Date().toISOString(),
      data: createMockProjectsData(),
    };
    // Force the serialized size past the limit by adding padding inside the JSON
    const raw =
      JSON.stringify(oversizedData).slice(0, -1) +
      "," +
      '"_padding":"' +
      "x".repeat(MAX_CACHE_SIZE_BYTES) +
      '"}';
    localStorage.setItem(PROJECTS_CACHE_KEY, raw);

    const mockData = createMockProjectsData();
    const fetchValidatedProjectsFromGitHub = vi
      .spyOn(githubProjects, "fetchValidatedProjectsFromGitHub")
      .mockResolvedValue(mockData);

    const result = await fetchProjects();

    expect(fetchValidatedProjectsFromGitHub).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockData);
  });

  it("returns data even when localStorage.setItem throws", async () => {
    const mockData = createMockProjectsData();
    vi.spyOn(
      githubProjects,
      "fetchValidatedProjectsFromGitHub",
    ).mockResolvedValue(mockData);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    const result = await fetchProjects();

    expect(result).toEqual(mockData);
  });

  it("accepts cache entry with extra top-level fields", async () => {
    const mockData = createMockProjectsData();
    localStorage.setItem(
      PROJECTS_CACHE_KEY,
      JSON.stringify({
        version: PROJECTS_CACHE_VERSION,
        cachedAt: new Date().toISOString(),
        data: mockData,
        extraField: "should be ignored",
        anotherExtra: 42,
      }),
    );
    const fetchValidatedProjectsFromGitHub = vi.spyOn(
      githubProjects,
      "fetchValidatedProjectsFromGitHub",
    );

    const result = await fetchProjects();

    expect(fetchValidatedProjectsFromGitHub).not.toHaveBeenCalled();
    expect(result).toEqual(mockData);
  });
});
