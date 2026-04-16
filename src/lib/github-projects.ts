/**
 * GitHub Projects Fetcher
 *
 * Fetches projects from GitHub issues and parses them into the project format.
 * Uses the GitHubClient for API calls.
 */

import { GitHubClient, type GitHubIssue } from "./github";
import {
  parseProjectsData,
  isValidProjectState,
  isValidProjectUsage,
  type ProjectsData,
  type Project,
} from "@/types/project.schema";
import {
  slugify,
  extractSection,
  extractKeyValue,
  extractLogo,
  parseImages,
  parseTags,
  parseNotes,
  parseDescription,
} from "./issue-parser";

// Configuration
const GITHUB_OWNER = "digidem";
const GITHUB_REPO = "awana-labs";
const PUBLISH_LABEL = "publish:yes";

/**
 * Parse a GitHub issue body into a Project
 */
function parseIssueToProject(issue: GitHubIssue): Project | null {
  const body = issue.body;
  if (!body) return null;

  // Extract title from first heading
  const titleMatch = body.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : issue.title.trim();

  if (!title) return null;

  const slug = slugify(title);
  const id = slug;

  // Extract sections
  const descriptionSection = extractSection(body, "Description");
  const organizationSection = extractSection(body, "Organization");
  const statusSection = extractSection(body, "Project Status");
  const tagsSection = extractSection(body, "Tags");
  const mediaSection = extractSection(body, "Media");
  const linksSection = extractSection(body, "Links");

  // Parse fields
  const orgName = extractKeyValue(organizationSection, "Name");
  const orgShortName = extractKeyValue(organizationSection, "Short name");
  const orgUrl = extractKeyValue(organizationSection, "Website");
  const statusState = extractKeyValue(statusSection, "State");
  const statusUsage = extractKeyValue(statusSection, "Usage");
  const statusNotes = parseNotes(statusSection);
  const tags = parseTags(tagsSection);
  const logo = extractLogo(mediaSection);
  const images = parseImages(mediaSection).filter((url) => url !== logo);
  const homepage = extractKeyValue(linksSection, "Homepage");
  const repository = extractKeyValue(linksSection, "Repository");
  const documentation = extractKeyValue(linksSection, "Documentation");
  const description = parseDescription(descriptionSection);

  // Validate required fields
  if (
    !title ||
    !description ||
    !orgName ||
    !orgShortName ||
    !orgUrl ||
    !statusState ||
    !homepage
  ) {
    console.error(`Missing required fields for project: ${title}`);
    return null;
  }

  if (!isValidProjectState(statusState)) {
    console.error(`Invalid project state for project: ${title}`);
    return null;
  }

  const usage = isValidProjectUsage(statusUsage) ? statusUsage : "experimental";

  // Build project object
  const project: Project = {
    id,
    issue_number: issue.number,
    title,
    slug,
    description,
    organization: {
      name: orgName,
      short_name: orgShortName,
      url: orgUrl,
    },
    status: {
      state: statusState,
      usage,
      notes: statusNotes,
    },
    tags,
    media: {
      logo,
      images,
    },
    links: {
      homepage,
      repository: repository || "",
      documentation: documentation || "",
    },
    timestamps: {
      created_at: issue.created_at,
      last_updated_at: issue.updated_at,
    },
  };

  return project;
}

// =============================================================================
// Fetch Functions
// =============================================================================

/**
 * Create a GitHub client (with optional token)
 */
function createClient(token?: string): GitHubClient {
  return new GitHubClient(token);
}

/**
 * Enrich projects with repository metadata (pushed_at, stargazers_count, forks_count).
 * Fetches repo data in parallel with a concurrency limit to avoid rate limits.
 * Failures are silently skipped — the project simply stays without repoMetadata.
 */
async function enrichWithRepoMetadata(
  projects: Project[],
  client: GitHubClient,
): Promise<void> {
  const BATCH_SIZE = 5;
  const withRepo = projects.filter((p) => p.links.repository);

  for (let i = 0; i < withRepo.length; i += BATCH_SIZE) {
    const batch = withRepo.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(
      batch.map(async (project) => {
        try {
          const url = project.links.repository
            .replace(/\.git$/, "")
            .replace(/\/+$/, "");
          const match = url.match(/(?:www\.)?github\.com\/([^/]+)\/([^/]+)/);
          if (!match) return;
          const [, owner, repo] = match;
          const repoData = await client.getRepository(owner, repo);
          project.repoMetadata = {
            pushed_at: repoData.pushed_at,
            stargazers_count: repoData.stargazers_count,
            forks_count: repoData.forks_count,
          };
        } catch {
          // Graceful degradation — skip this repo
        }
      }),
    );
  }
}

/**
 * Fetch projects from GitHub issues
 * Fetches issues with 'publish:yes' label and parses them into projects.
 * The runtime path reads issues directly from GitHub; it does not depend on a
 * generated static asset.
 */
export async function fetchProjectsFromGitHub(
  owner = GITHUB_OWNER,
  repo = GITHUB_REPO,
  label = PUBLISH_LABEL,
  token?: string,
): Promise<ProjectsData> {
  const client = createClient(token);

  console.log(`Fetching issues with label "${label}" from ${owner}/${repo}...`);

  try {
    const issues = await client.getIssues(owner, repo, {
      labels: label,
      state: "all",
      per_page: 100,
    });

    console.log(`Found ${issues.length} issues, parsing projects...`);

    const projects: Project[] = [];

    for (const issue of issues) {
      const project = parseIssueToProject(issue);
      if (project) {
        projects.push(project);
      } else {
        console.warn(`Failed to parse issue #${issue.number}: ${issue.title}`);
      }
    }

    console.log(`Successfully parsed ${projects.length} projects`);

    // Enrich projects with repo metadata (pushed_at, stargazers, forks)
    await enrichWithRepoMetadata(projects, client);

    return { projects };
  } catch (error) {
    console.error("Error fetching from GitHub:", error);
    throw error;
  }
}

/**
 * Fetch projects with validation
 * Validates the parsed projects against the schema
 */
export async function fetchValidatedProjectsFromGitHub(
  owner = GITHUB_OWNER,
  repo = GITHUB_REPO,
  label = PUBLISH_LABEL,
  token?: string,
): Promise<ProjectsData> {
  const data = await fetchProjectsFromGitHub(owner, repo, label, token);
  return parseProjectsData(data);
}
