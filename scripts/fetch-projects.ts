/**
 * Fetch publishable projects from GitHub Issues
 *
 * This script fetches all issues from the repository that have the 'publish:yes'
 * label, parses them with the shared project schema, and prints a validation
 * summary. The runtime app fetches project data from GitHub, validates it, and
 * caches the payload in browser localStorage; there is no committed or generated
 * data file.
 *
 * Environment Variables:
 *   GITHUB_TOKEN - GitHub token for API authentication (provided by Actions)
 *   GITHUB_REPOSITORY - Repository in format "owner/repo" (provided by Actions)
 */

// Import the parser and Octokit
import { parseIssueBody, type ProjectData } from "./parse-issue.js";
import { Octokit } from "@octokit/rest";

// Octokit from @octokit/rest includes pagination support built-in

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

type GitHubErrorLike = Error & {
  status?: number;
};

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
    userAgent: "awana-labs-fetch-projects",
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
      // Re-throw environment variable errors
      if (
        error.message.includes("GITHUB_TOKEN") ||
        error.message.includes("GITHUB_REPOSITORY") ||
        error.message.includes("Invalid GITHUB_REPOSITORY format")
      ) {
        throw error;
      }

      const status = (error as GitHubErrorLike).status;
      const message = error.message;
      const normalizedMessage = message.toLowerCase();

      if (status === 401 || normalizedMessage.includes("bad credentials")) {
        throw new Error(
          "GitHub API authentication failed. Please check your GITHUB_TOKEN is valid."
        );
      }

      if (status === 404 || normalizedMessage.includes("not found")) {
        throw new Error(
          `Repository ${owner}/${name} not found or token lacks access.`
        );
      }

      if (
        status === 429 ||
        normalizedMessage.includes("rate limit") ||
        normalizedMessage.includes("secondary rate limit")
      ) {
        throw new Error(`GitHub API rate limit exceeded. ${message}`);
      }

      throw new Error(`GitHub API error: ${message}`);
    }
    throw new Error("Unknown error occurred while fetching issues");
  }
}

/**
 * Parse project metadata from issue body using the dedicated parser
 */
function parseProjectFromIssue(issue: GitHubIssue): ProjectData | null {
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

    // The parser returns ProjectData from the shared schema layer.
    return parsed;
  } catch (error) {
    console.error(`Error parsing issue #${issue.number}:`, error);
    return null;
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    console.log("Fetching projects from GitHub issues...");
    const issues = await fetchPublishableIssues();

    console.log("Parsing issues into project data...");
    const projects: ProjectData[] = [];
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

    console.log(
      "Validation complete. No build-time artifact was written; runtime consumers fetch and cache the validated payload directly from GitHub.",
    );

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
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  main();
}

// Export for testing
export { fetchPublishableIssues, parseProjectFromIssue };
