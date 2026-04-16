/**
 * Shared E2E test fixtures and helpers
 *
 * Provides project fixture data, cache seeding helpers,
 * and GitHub issue mock data used across E2E test files.
 */

import { type Page } from "@playwright/test";

/** Canonical E2E project fixture matching the CoMapeo Config Spreadsheet Plugin */
export const projectFixture = {
  id: "comapeo-config-spreadsheet-plugin",
  issue_number: 2,
  title: "CoMapeo Config Spreadsheet Plugin",
  slug: "comapeo-config-spreadsheet-plugin",
  description: "Google Sheets plugin for CoMapeo configurations.",
  organization: {
    name: "Digital Democracy",
    short_name: "Awana Digital",
    url: "https://www.digital-democracy.org",
  },
  status: {
    state: "active",
    usage: "widely-used",
    notes: "Used in multiple deployments.",
  },
  tags: ["CoMapeo", "Mapping", "Spreadsheet"],
  media: {
    logo: "https://images.unsplash.com/photo-1",
    images: [
      "https://images.unsplash.com/photo-2",
      "https://images.unsplash.com/photo-3",
    ],
  },
  links: {
    homepage: "https://www.digital-democracy.org/comapeo",
    repository:
      "https://github.com/digidem/comapeo-config-spreadsheet-plugin",
    documentation: "https://docs.example.com/comapeo",
  },
  timestamps: {
    created_at: "2024-01-01T00:00:00.000Z",
    last_updated_at: "2024-01-02T00:00:00.000Z",
  },
} as const;

/** Projects payload wrapping the fixture */
export const projectsPayload = {
  projects: [projectFixture],
} as const;

/** Create a cache entry with optional staleness */
export function createCacheEntry(stale = false) {
  return {
    version: 2,
    cachedAt: new Date(
      stale ? Date.now() - 1000 * 60 * 60 * 2 : Date.now(),
    ).toISOString(),
    data: projectsPayload,
  } as const;
}

/** Seed the projects cache in localStorage */
export async function seedProjectsCache(
  page: Page,
  cacheEntry = createCacheEntry(),
) {
  await page.addInitScript((entry) => {
    window.localStorage.setItem(
      "awana-labs-projects-cache",
      JSON.stringify(entry),
    );
  }, cacheEntry);
}

/** Pin the app language to English */
export async function pinAppLanguage(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("awana-labs-language", "en");
    window.localStorage.setItem("i18nextLng", "en");
  });
}

/** Set navigator.onLine to false for offline testing */
export async function setNavigatorOffline(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      get: () => false,
    });
  });
}

/** GitHub issue fixture matching the project fixture */
export const githubIssueFixture = {
  number: 2,
  title: projectFixture.title,
  body: `# ${projectFixture.title}

## Description
${projectFixture.description}

## Organization
**Name:** ${projectFixture.organization.name}
**Short name:** ${projectFixture.organization.short_name}
**Website:** ${projectFixture.organization.url}

## Project Status
**State:** ${projectFixture.status.state}
**Usage:** ${projectFixture.status.usage}
**Notes:**
${projectFixture.status.notes}

## Tags
${projectFixture.tags.join(", ")}

## Media
**Logo:** ${projectFixture.media.logo}
**Images:**
${projectFixture.media.images.join("\n")}

## Links
**Homepage:** ${projectFixture.links.homepage}
**Repository:** ${projectFixture.links.repository}
**Documentation:** ${projectFixture.links.documentation}
`,
  state: "open",
  html_url: "https://github.com/digidem/awana-labs/issues/2",
  created_at: projectFixture.timestamps.created_at,
  updated_at: projectFixture.timestamps.last_updated_at,
  labels: [{ name: "publish:yes" }],
  user: {
    login: "digidem",
    type: "User",
  },
} as const;

/** Mock GitHub API to return the fixture issue */
export async function mockGitHubProjects(page: Page) {
  let requestCount = 0;

  await page.route(
    "https://api.github.com/repos/**/issues**",
    async (route) => {
      requestCount += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([githubIssueFixture]),
      });
    },
  );

  return {
    getRequestCount: () => requestCount,
  };
}
