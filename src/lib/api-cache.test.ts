import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as githubProjects from "./github-projects";
import {
  fetchProjects,
  PROJECTS_CACHE_KEY,
  PROJECTS_CACHE_MAX_AGE_MS,
  PROJECTS_CACHE_VERSION,
  readProjectsCache,
  writeProjectsCache,
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

function setOnlineStatus(value: boolean) {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    get: () => value,
  });
}

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
    const mockData = createProjectsData();
    const fetchValidatedProjectsFromGitHub = vi
      .spyOn(githubProjects, "fetchValidatedProjectsFromGitHub")
      .mockResolvedValue(mockData);

    const result = await fetchProjects();

    expect(fetchValidatedProjectsFromGitHub).toHaveBeenCalledTimes(1);
    expect(result.headers.get("x-awana-projects-source")).toBe("github");
    expect(result.data).toEqual(mockData);
  });

  it("writes validated GitHub payloads to localStorage", async () => {
    const mockData = createProjectsData();
    vi.spyOn(githubProjects, "fetchValidatedProjectsFromGitHub").mockResolvedValue(
      mockData,
    );

    await fetchProjects();

    const cached = readProjectsCache();
    expect(cached).not.toBeNull();
    expect(cached?.entry.version).toBe(PROJECTS_CACHE_VERSION);
    expect(cached?.entry.data).toEqual(mockData);
    expect(cached?.isStale).toBe(false);
  });

  it("reuses a fresh validated cache entry without refetching", async () => {
    const mockData = createProjectsData();
    writeProjectsCache(mockData);
    const fetchValidatedProjectsFromGitHub = vi.spyOn(
      githubProjects,
      "fetchValidatedProjectsFromGitHub",
    );

    const result = await fetchProjects();

    expect(fetchValidatedProjectsFromGitHub).not.toHaveBeenCalled();
    expect(result.headers.get("x-awana-projects-source")).toBe("cache");
    expect(result.headers.get("x-awana-projects-cache-stale")).toBe("false");
    expect(result.data).toEqual(mockData);
  });

  it("rejects invalid cached payloads and replaces them with fresh data", async () => {
    const mockData = createProjectsData();
    writeRawCache({
      projects: [{ id: "broken-project" }],
    });
    const fetchValidatedProjectsFromGitHub = vi
      .spyOn(githubProjects, "fetchValidatedProjectsFromGitHub")
      .mockResolvedValue(mockData);

    const result = await fetchProjects();

    expect(fetchValidatedProjectsFromGitHub).toHaveBeenCalledTimes(1);
    expect(result.headers.get("x-awana-projects-source")).toBe("github");
    expect(readProjectsCache()?.entry.data).toEqual(mockData);
  });

  it("falls back to cached projects while offline", async () => {
    const mockData = createProjectsData();
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
    expect(result.headers.get("x-awana-projects-source")).toBe("cache");
    expect(result.headers.get("x-awana-projects-cache-stale")).toBe("true");
    expect(result.data).toEqual(mockData);
  });

  it("falls back to stale cached projects when a refresh fails", async () => {
    const mockData = createProjectsData();
    writeRawCache(
      mockData,
      new Date(Date.now() - PROJECTS_CACHE_MAX_AGE_MS - 1000).toISOString(),
    );
    const fetchValidatedProjectsFromGitHub = vi
      .spyOn(githubProjects, "fetchValidatedProjectsFromGitHub")
      .mockRejectedValue(new Error("GitHub unavailable"));

    const result = await fetchProjects();

    expect(fetchValidatedProjectsFromGitHub).toHaveBeenCalledTimes(1);
    expect(result.headers.get("x-awana-projects-source")).toBe("cache");
    expect(result.headers.get("x-awana-projects-cache-stale")).toBe("true");
    expect(result.data).toEqual(mockData);
  });
});
