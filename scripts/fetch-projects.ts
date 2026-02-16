/**
 * Fetch Publishable Projects from GitHub Issues
 *
 * This script fetches all issues from the repository that have the 'publish:yes'
 * label and generates the public/projects.json file.
 *
 * Environment Variables:
 *   GITHUB_TOKEN - GitHub token for API authentication (provided by Actions)
 *   GITHUB_REPOSITORY - Repository in format "owner/repo" (provided by Actions)
 */

// Import the parser and Octokit
import { parseIssueBody } from "./parse-issue.js";
import { Octokit } from "@octokit/rest";

// Octokit from @octokit/rest includes pagination support built-in

// Declare Bun global for TypeScript
declare const Bun: {
  write: (path: string, content: string) => Promise<void>;
};

// TypeScript types for GitHub API responses
interface GitHubLabel {
  id: number;
  node_id: string;
  url: string;
  name: string;
  color: string;
  default: boolean;
  description: string | null;
}

interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  labels: GitHubLabel[];
  created_at: string;
  updated_at: string;
  state: string;
  html_url: string;
  user: {
    login: string;
    type: string;
  };
}

// Project data structure matching the expected public/projects.json format
interface Project {
  id: string;
  issue_number: number;
  title: string;
  slug: string;
  description: string;
  organization: {
    name: string;
    short_name: string;
    url: string;
  };
  status: {
    state: string;
    usage: string;
    notes: string;
  };
  tags: string[];
  media: {
    logo: string;
    images: string[];
  };
  links: {
    homepage: string;
    repository: string;
    documentation: string;
  };
  timestamps: {
    created_at: string;
    last_updated_at: string;
  };
}

interface ProjectsData {
  projects: Project[];
}

// Configuration constants
const PUBLISH_LABEL = "publish:yes";
const ISSUES_PER_PAGE = 100;

/**
 * Fetch all issues with the publish:yes label from GitHub
 * Handles pagination automatically to retrieve all matching issues
 */
async function fetchPublishableIssues(): Promise<GitHubIssue[]> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;

  if (!token) {
    throw new Error("GITHUB_TOKEN environment variable is required");
  }

  if (!repo) {
    throw new Error("GITHUB_REPOSITORY environment variable is required");
  }

  const parts = repo.split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(
      `Invalid GITHUB_REPOSITORY format: "${repo}". Expected "owner/repo".`,
    );
  }
  const [owner, name] = parts;

  console.log(
    `Fetching issues with label "${PUBLISH_LABEL}" from ${owner}/${name}...`,
  );

  // Initialize Octokit with authentication
  const octokit = new Octokit({
    auth: token,
    userAgent: "awana-labs-showcase-fetch-projects",
  });

  try {
    const allIssues: GitHubIssue[] = [];

    // Use Octokit's paginate to automatically handle pagination
    const iterator = octokit.paginate.iterator(
      "GET /repos/{owner}/{repo}/issues",
      {
        owner,
        repo: name,
        labels: PUBLISH_LABEL,
        state: "all",
        per_page: ISSUES_PER_PAGE,
        sort: "created",
        direction: "desc",
      },
    );

    for await (const response of iterator) {
      const issues = response.data as GitHubIssue[];
      allIssues.push(...issues);

      console.log(`Fetched ${allIssues.length} issues...`);
    }

    console.log(
      `Successfully fetched ${allIssues.length} issues with label "${PUBLISH_LABEL}"`,
    );
    return allIssues;
  } catch (error) {
    if (error instanceof Error) {
      // Handle Octokit-specific errors
      if (error.message.includes("Bad credentials")) {
        throw new Error(
          "GitHub API authentication failed. Please check your GITHUB_TOKEN is valid.",
        ) as Error & { cause: unknown };
      } else if (error.message.includes("Not Found")) {
        throw new Error(
          `Repository ${owner}/${name} not found or token lacks access.`,
        ) as Error & { cause: unknown };
      } else if (error.message.includes("rate limit")) {
        throw new Error(`GitHub API rate limit exceeded. ${error.message}`) as Error & {
          cause: unknown;
        };
      }

      // Re-throw environment variable errors
      if (
        error.message.includes("GITHUB_TOKEN") ||
        error.message.includes("GITHUB_REPOSITORY") ||
        error.message.includes("Invalid GITHUB_REPOSITORY format")
      ) {
        throw error;
      }

      throw new Error(`GitHub API error: ${error.message}`) as Error & {
        cause: unknown;
      };
    }
    throw new Error("Unknown error occurred while fetching issues") as Error & {
      cause: unknown;
    };
  }
}

/**
 * Parse project metadata from issue body using the dedicated parser
 */
function parseProjectFromIssue(issue: GitHubIssue): Project | null {
  try {
    if (!issue.body) {
      console.error(`Issue #${issue.number} has no body content`);
      return null;
    }

    // Use the dedicated parser from parse-issue.ts
    const parsed = parseIssueBody(
      issue.body,
      issue.number,
      issue.created_at,
      issue.updated_at,
    );

    if (!parsed) {
      console.error(`Failed to parse issue #${issue.number}`);
      return null;
    }

    // The parser returns ProjectData which matches our Project interface
    return parsed as Project;
  } catch (error) {
    console.error(`Error parsing issue #${issue.number}:`, error);
    return null;
  }
}

/**
 * Convert a title to a URL-safe slug
 */
function slugify(text: string): string {
  if (!text || typeof text !== "string") {
    return "unknown";
  }
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Write projects data to public/projects.json
 */
async function writeProjectsFile(projects: Project[]): Promise<void> {
  const data: ProjectsData = { projects };
  const content = JSON.stringify(data, null, 2);
  await Bun.write("public/projects.json", content);
  console.log("Updated public/projects.json");
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    console.log("Fetching projects from GitHub issues...");
    const issues = await fetchPublishableIssues();

    console.log("Parsing issues into project data...");
    const projects: Project[] = [];
    const failedIssues: number[] = [];

    for (const issue of issues) {
      const project = parseProjectFromIssue(issue);
      if (project) {
        projects.push(project);
      } else {
        failedIssues.push(issue.number);
      }
    }

    if (failedIssues.length > 0) {
      console.warn(
        `Warning: Failed to parse ${failedIssues.length} issue(s): #${failedIssues.join(", #")}`,
      );
    }

    console.log(`Successfully parsed ${projects.length} projects`);

    console.log("Writing projects.json...");
    await writeProjectsFile(projects);

    // Print summary
    console.log(`\n--- SUMMARY ---`);
    console.log(`Total projects: ${projects.length}`);

    const activeProjects = projects.filter(
      (p) => p.status.state === "active",
    ).length;
    const pausedProjects = projects.filter(
      (p) => p.status.state === "paused",
    ).length;
    const archivedProjects = projects.filter(
      (p) => p.status.state === "archived",
    ).length;
    console.log(
      `Active: ${activeProjects}, Paused: ${pausedProjects}, Archived: ${archivedProjects}`,
    );

    if (projects.length > 0) {
      console.log("\nLatest projects:");
      projects.slice(0, 5).forEach((project) => {
        console.log(
          `  #${project.issue_number}: ${project.title} (${project.status.state})`,
        );
      });
    }

    console.log("\nDone!");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Execute main function if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// Export for testing
export { fetchPublishableIssues, parseProjectFromIssue, slugify };
