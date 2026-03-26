import { test, expect, type Page } from "@playwright/test";

const projectFixture = {
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

const projectsPayload = {
  projects: [projectFixture],
} as const;

function createCacheEntry(stale = false) {
  return {
    version: 1,
    cachedAt: new Date(
      stale ? Date.now() - 1000 * 60 * 60 * 2 : Date.now(),
    ).toISOString(),
    data: projectsPayload,
  } as const;
}

const githubIssueFixture = {
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
  html_url: "https://github.com/luandro/awana-labs-showcase/issues/2",
  created_at: projectFixture.timestamps.created_at,
  updated_at: projectFixture.timestamps.last_updated_at,
  labels: [{ name: "publish:yes" }],
  user: {
    login: "luandro",
    type: "User",
  },
} as const;

async function seedProjectsCache(page: Page, cacheEntry = createCacheEntry()) {
  await page.addInitScript((entry) => {
    window.localStorage.setItem("awana-labs-projects-cache", JSON.stringify(entry));
  }, cacheEntry);
}

async function setNavigatorOffline(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      get: () => false,
    });
  });
}

async function mockGitHubProjects(page: Page) {
  let requestCount = 0;

  await page.route("https://api.github.com/repos/**/issues**", async (route) => {
    requestCount += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([githubIssueFixture]),
    });
  });

  return {
    getRequestCount: () => requestCount,
  };
}

test.describe("Projects runtime contract", () => {
  test("renders projects from the runtime cache contract", async ({ page }) => {
    await seedProjectsCache(page);

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("button", {
        name: /view details for CoMapeo Config Spreadsheet Plugin/i,
      }),
    ).toBeVisible();
    await expect(page.locator("#projects")).toContainText(
      "Google Sheets plugin for CoMapeo configurations.",
    );
  });

  test("fetches projects from GitHub on cold start and caches the result", async ({
    page,
  }) => {
    await mockGitHubProjects(page);

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("button", {
        name: /view details for CoMapeo Config Spreadsheet Plugin/i,
      }),
    ).toBeVisible();

    const cacheEntry = await page.evaluate(() =>
      JSON.parse(window.localStorage.getItem("awana-labs-projects-cache") ?? "null"),
    );

    expect(cacheEntry?.version).toBe(1);
    expect(cacheEntry?.data?.projects?.[0]?.title).toBe(
      "CoMapeo Config Spreadsheet Plugin",
    );
  });

  test("rejects invalid cached payloads and refreshes from GitHub", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "awana-labs-projects-cache",
        JSON.stringify({
          version: 1,
          cachedAt: "2026-03-25T00:00:00.000Z",
          data: { projects: [{ id: "broken-project" }] },
        }),
      );
    });
    await mockGitHubProjects(page);

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("button", {
        name: /view details for CoMapeo Config Spreadsheet Plugin/i,
      }),
    ).toBeVisible();

    const cacheEntry = await page.evaluate(() =>
      JSON.parse(window.localStorage.getItem("awana-labs-projects-cache") ?? "null"),
    );

    expect(cacheEntry?.data?.projects?.[0]?.slug).toBe(
      "comapeo-config-spreadsheet-plugin",
    );
  });

  test("falls back to cached projects while offline", async ({ page }) => {
    await seedProjectsCache(page, createCacheEntry(true));
    await setNavigatorOffline(page);

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("button", {
        name: /view details for CoMapeo Config Spreadsheet Plugin/i,
      }),
    ).toBeVisible();
    await expect(page.locator("#projects")).toContainText(
      "Google Sheets plugin for CoMapeo configurations.",
    );
  });
});
