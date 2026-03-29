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

// Configuration
const GITHUB_OWNER = "luandro";
const GITHUB_REPO = "awana-labs-showcase";
const PUBLISH_LABEL = "publish:yes";

// =============================================================================
// Image URL Validation
// =============================================================================

function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Must be HTTPS — no host allowlist needed since images render in
    // sandboxed <img> tags and can't execute code.
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// =============================================================================
// Parsing Functions
// =============================================================================

/**
 * Slugify a string for URL-safe identifiers
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Section content type
 */
type SectionContent = {
  raw: string;
  lines: string[];
};

/**
 * Extract a section from markdown body by heading name
 */
function extractSection(
  body: string,
  sectionName: string,
): SectionContent | null {
  const lines = body.split("\n");
  const startIndex = lines.findIndex((line) => {
    const trimmed = line.trim();
    const headingMatch = trimmed.match(/^#{1,3}\s+(.+)$/i);
    if (!headingMatch) return false;
    const headingText = headingMatch[1].trim().toLowerCase();
    return headingText === sectionName.toLowerCase();
  });

  if (startIndex === -1) return null;

  const sectionLines: string[] = [];
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^#{1,3}\s+/.test(line.trim())) break;
    if (/^[-*_]{3,}\s*$/.test(line.trim())) break;
    sectionLines.push(line);
  }

  return {
    raw: sectionLines.join("\n").trim(),
    lines: sectionLines.map((l) => l.trim()),
  };
}

/**
 * Extract a key-value pair from section content
 */
function extractKeyValue(
  section: SectionContent | null,
  key: string,
): string {
  if (!section) return "";

  const keyPattern = new RegExp(
    `^\\*\\*${key}\\*\\*:\\s*(.+)$|^\\*?\\*?${key}\\*?\\*?:\\s*(.+)$`,
    "im",
  );

  for (let i = 0; i < section.lines.length; i++) {
    const line = section.lines[i];
    const match = line.match(keyPattern);
    if (match) {
      let value = (match[1] || match[2] || "").trim();
      value = value.replace(/^\*\*|\*\*$/g, "").trim();
      if (!value && i + 1 < section.lines.length) {
        value = section.lines[i + 1].trim().replace(/^\*\*|\*\*$/g, "");
      }
      return value;
    }
  }

  return "";
}

/**
 * Extract logo URL from media section
 */
function extractLogo(section: SectionContent | null): string {
  if (!section) return "";

  const logoIndex = section.lines.findIndex((line) => {
    const lower = line.toLowerCase();
    return lower.startsWith("**logo") && lower.indexOf("**") === 0;
  });

  if (logoIndex !== -1) {
    const logoLine = section.lines[logoIndex];
    const urlMatch = logoLine.match(/https?:\/\/[^\s]+/i);
    if (urlMatch) {
      const url = urlMatch[0].trim();
      if (isValidImageUrl(url)) return url;
    }

    if (logoIndex + 1 < section.lines.length) {
      const nextUrlMatch = section.lines[logoIndex + 1].match(/https?:\/\/[^\s]+/i);
      if (nextUrlMatch) {
        const url = nextUrlMatch[0].trim();
        if (isValidImageUrl(url)) return url;
      }
    }
  }

  return "";
}

/**
 * Parse images from section content
 */
function parseImages(section: SectionContent | null): string[] {
  if (!section || !section.raw) return [];

  const urls: string[] = [];
  const logoUrl = extractLogo(section);

  const imagesIndex = section.lines.findIndex((line) =>
    line.toLowerCase().startsWith("**images"),
  );

  const startIndex = imagesIndex !== -1 ? imagesIndex + 1 : 0;
  const searchText = section.lines.slice(startIndex).join("\n");

  const urlPattern = /https?:\/\/[^\s]+/gi;
  const matches = searchText.matchAll(urlPattern);
  for (const match of matches) {
    const url = match[0].trim();
    if (url && url !== logoUrl && isValidImageUrl(url)) {
      urls.push(url);
    }
  }

  return urls;
}

/**
 * Parse tags from section content
 */
function parseTags(section: SectionContent | null): string[] {
  if (!section || !section.raw) return [];
  return section.raw
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

/**
 * Parse notes from status section
 */
function parseNotes(section: SectionContent | null): string {
  if (!section || !section.raw) return "";

  const notesIndex = section.lines.findIndex((line) =>
    line.toLowerCase().includes("**notes"),
  );

  if (notesIndex !== -1 && notesIndex + 1 < section.lines.length) {
    return section.lines.slice(notesIndex + 1).join(" ").trim();
  }

  return "";
}

/**
 * Parse description from section
 */
function parseDescription(section: SectionContent | null): string {
  if (!section || !section.raw) return "";

  // Description is just plain text - no field patterns to remove
  return section.raw.trim();
}

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
  if (!title || !description || !orgName || !orgShortName || !orgUrl || !statusState || !homepage) {
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

// Re-export for convenience
export { GitHubClient, type GitHubIssue } from "./github";
