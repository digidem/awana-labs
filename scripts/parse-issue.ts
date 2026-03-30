/**
 * parse-issue.ts - GitHub Issue to Project JSON Parser
 *
 * Parses GitHub issue Markdown body into the shared project schema used by
 * the runtime GitHub fetch path and the browser localStorage cache.
 *
 * This module uses Zod schemas defined in ../src/types/project.schema.ts
 * for runtime validation of parsed project data.
 */

// Import validation schema and types
import { projectSchema, type Project } from "../src/types/project.schema.js";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Raw section content extracted from issue body
 */
interface SectionContent {
  raw: string;
  lines: string[];
}

/**
 * Raw parsed project data before validation
 * Internal type used during parsing before Zod validation
 */
interface RawProjectData {
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

/**
 * Validated project data type exported from this module
 * Re-exported from the schema for convenience
 */
export type ProjectData = Project;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Slugify a string for URL-safe identifiers
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .trim();
}

/**
 * Extract a section from markdown body by heading name
 * Handles various heading styles (# ## ###) and separators
 */
function extractSection(
  body: string,
  sectionName: string,
): SectionContent | null {
  const lines = body.split("\n");
  const startIndex = lines.findIndex((line) => {
    const trimmed = line.trim();
    // Match ## Section Name or # Section Name (case-insensitive)
    // Use exact word boundary matching to avoid partial matches
    const headingMatch = trimmed.match(/^#{1,3}\s+(.+)$/i);
    if (!headingMatch) return false;
    const headingText = headingMatch[1].trim().toLowerCase();
    const targetName = sectionName.toLowerCase();
    return headingText === targetName;
  });

  if (startIndex === -1) {
    return null;
  }

  // Find the end of the section (next heading or horizontal rule)
  const sectionLines: string[] = [];
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    // Stop at next heading
    if (/^#{1,3}\s+/.test(line.trim())) {
      break;
    }
    // Stop at horizontal rule
    if (/^[-*_]{3,}\s*$/.test(line.trim())) {
      break;
    }
    sectionLines.push(line);
  }

  return {
    raw: sectionLines.join("\n").trim(),
    lines: sectionLines.map((l) => l.trim()),
  };
}

/**
 * Extract a key-value pair from section content
 * Handles formats like "**Key:** value" or "Key: value"
 * Also handles values on the next line after the key
 */
function extractKeyValue(section: SectionContent | null, key: string): string {
  if (!section) {
    return "";
  }

  // Match lines with optional bold markdown around the key, capture the value
  const keyPattern = new RegExp(
    `^\\*\\*${escapeRegex(key)}\\*\\*:\\s*(.+)$|^\\*?\\*?${escapeRegex(key)}\\*?\\*?:\\s*(.+)$`,
    "im",
  );

  for (let i = 0; i < section.lines.length; i++) {
    const line = section.lines[i];
    const match = line.match(keyPattern);
    if (match) {
      // Return the first capturing group that has content, and remove any remaining bold markers
      let value = (match[1] || match[2] || "").trim();
      // Remove any remaining ** markers from the value
      value = value.replace(/^\*\*|\*\*$/g, "").trim();

      // If value is empty or just contains whitespace/markers, check the next line
      if (!value && i + 1 < section.lines.length) {
        value = section.lines[i + 1].trim();
        // Remove any URL from the value (for fields that might have URLs)
        value = value.replace(/^\*\*|\*\*$/g, "").trim();
      }

      return value;
    }
  }

  return "";
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Parse comma-separated tags from section content
 */
function parseTags(section: SectionContent | null): string[] {
  if (!section || !section.raw) {
    return [];
  }

  // Split by comma and trim whitespace
  const tags = section.raw
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

  return tags;
}

/**
 * Extract logo URL from media section
 */
function extractLogo(section: SectionContent | null): string {
  if (!section) {
    return "";
  }

  // Look for "**Logo:**" pattern and get the URL from the same or next line
  const logoIndex = section.lines.findIndex((line) => {
    const lower = line.toLowerCase();
    // Check if line starts with "**logo" and contains "**"
    return lower.startsWith("**logo") && lower.indexOf("**") === 0;
  });

  if (logoIndex !== -1) {
    // First try to get URL from the same line
    const logoLine = section.lines[logoIndex];
    const urlMatch = logoLine.match(/https?:\/\/[^\s]+/i);
    if (urlMatch) {
      return urlMatch[0].trim();
    }

    // If not found on the same line, check the next line
    if (logoIndex + 1 < section.lines.length) {
      const nextLine = section.lines[logoIndex + 1];
      const nextUrlMatch = nextLine.match(/https?:\/\/[^\s]+/i);
      if (nextUrlMatch) {
        return nextUrlMatch[0].trim();
      }
    }
  }

  return "";
}

/**
 * Parse images from section content
 * Handles line-separated URLs, excluding the logo and URLs from known field lines
 */
function parseImages(section: SectionContent | null): string[] {
  if (!section || !section.raw) {
    return [];
  }

  const urls: string[] = [];

  // First, find and exclude the logo URL
  const logoUrl = extractLogo(section);

  // Find the index of the "**Images:**" marker
  const imagesIndex = section.lines.findIndex((line) => {
    const lower = line.toLowerCase();
    // Check if line starts with "**images"
    return lower.startsWith("**images");
  });

  // If we found the Images marker, only extract URLs after it
  // Otherwise extract all URLs except the logo
  let startIndex = 0;
  if (imagesIndex !== -1) {
    // Start from the line after "**Images:**"
    startIndex = imagesIndex + 1;
  }

  // Build the text to search from the appropriate starting point
  const searchText = section.lines.slice(startIndex).join("\n");

  // Use matchAll instead of exec in loop to avoid regex state mutation
  const urlPattern = /https?:\/\/[^\s]+/gi;
  const matches = searchText.matchAll(urlPattern);
  for (const match of matches) {
    const url = match[0].trim();
    // Skip the logo URL and empty URLs
    if (url && url !== logoUrl) {
      urls.push(url);
    }
  }

  return urls;
}

/**
 * Parse multi-line notes from status section
 * Notes may span multiple lines after "**Notes:**" marker
 */
function parseNotes(section: SectionContent | null): string {
  if (!section || !section.raw) {
    return "";
  }

  // Find the notes section and extract all content after it
  const lines = section.lines;
  const notesIndex = lines.findIndex((line) => {
    const lower = line.toLowerCase();
    // Check if line starts with "**notes"
    return lower.startsWith("**notes");
  });

  if (notesIndex === -1) {
    return "";
  }

  // Collect all lines after the Notes marker
  const notesLines: string[] = [];
  for (let i = notesIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    // Stop if we hit another bold field marker (starts with **)
    if (line.startsWith("**")) {
      break;
    }
    if (line.length > 0) {
      notesLines.push(line);
    }
  }

  // Also check if there's content on the same line as the marker
  const notesMarkerLine = lines[notesIndex];
  // Find the colon and skip past it (also skip the closing **)
  const colonIndex = notesMarkerLine.indexOf(":");
  let sameLineContent = "";
  if (colonIndex >= 0) {
    sameLineContent = notesMarkerLine.substring(colonIndex + 1).trim();
    // Remove any remaining asterisks
    sameLineContent = sameLineContent.replace(/\*+/g, "").trim();
  }

  const allNotes = sameLineContent
    ? [sameLineContent, ...notesLines]
    : notesLines;
  return allNotes.join(" ").trim();
}

/**
 * Parse description from description section
 * Handles multi-line paragraphs
 */
function parseDescription(section: SectionContent | null): string {
  if (!section || !section.raw) {
    return "";
  }

  // Return raw content, cleaning up extra whitespace
  return section.raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n\n");
}

// ============================================================================
// Main Parser Function
// ============================================================================

/**
 * Parse GitHub issue body into project data
 *
 * @param issueBody - The raw markdown body from the GitHub issue
 * @param issueNumber - The issue number
 * @param createdAt - ISO timestamp of issue creation
 * @param updatedAt - ISO timestamp of last update
 * @returns ProjectData object matching the schema
 */
export function parseIssueBody(
  issueBody: string,
  issueNumber: number,
  createdAt: string,
  updatedAt: string,
): ProjectData | null {
  // Extract title from first heading
  const titleMatch = issueBody.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : "";

  if (!title) {
    return null;
  }

  const slug = slugify(title);
  const id = slug;

  // Extract all sections
  const descriptionSection = extractSection(issueBody, "Description");
  const organizationSection = extractSection(issueBody, "Organization");
  const statusSection = extractSection(issueBody, "Project Status");
  const tagsSection = extractSection(issueBody, "Tags");
  const mediaSection = extractSection(issueBody, "Media");
  const linksSection = extractSection(issueBody, "Links");

  // Parse organization
  const orgName = extractKeyValue(organizationSection, "Name");
  const orgShortName = extractKeyValue(organizationSection, "Short name");
  const orgUrl = extractKeyValue(organizationSection, "Website");

  // Parse status
  const statusState = extractKeyValue(statusSection, "State");
  const statusUsage = extractKeyValue(statusSection, "Usage");
  const statusNotes = parseNotes(statusSection);

  // Parse tags
  const tags = parseTags(tagsSection);

  // Parse media
  const logo = extractLogo(mediaSection);
  const images = parseImages(mediaSection).filter((url) => url !== logo);

  // Parse links
  const homepage = extractKeyValue(linksSection, "Homepage");
  const repository = extractKeyValue(linksSection, "Repository");
  const documentation = extractKeyValue(linksSection, "Documentation");

  // Parse description
  const description = parseDescription(descriptionSection);

  // Validate required fields before returning
  const requiredFields: Record<string, string> = {
    title,
    description,
    orgName,
    orgShortName,
    orgUrl,
    statusState,
    homepage,
  };

  for (const [fieldName, value] of Object.entries(requiredFields)) {
    if (!value || value.trim() === "") {
      console.error(`Missing required field: ${fieldName}`);
      return null;
    }
  }

  // Build raw project object
  const rawProject: RawProjectData = {
    id,
    issue_number: issueNumber,
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
      usage: statusUsage || "unknown",
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
      created_at: createdAt,
      last_updated_at: updatedAt,
    },
  };

  // Validate with Zod schema
  const validationResult = projectSchema.safeParse(rawProject);

  if (!validationResult.success) {
    console.error(`Validation failed for issue #${issueNumber}:`);
    console.error(validationResult.error.format());
    return null;
  }

  return validationResult.data;
}

// ============================================================================
// CLI Usage (for running directly with tsx/vite-node)
// ============================================================================

// Only run CLI when this is the main module (not when imported)
const isMainModule =
  import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`;

if (isMainModule) {
  // This block runs when the file is executed directly
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Usage: npx tsx parse-issue.ts <issue-body-file> [options]

Arguments:
  issue-body-file    Path to file containing the issue body markdown

Options:
  --number, -n       Issue number (required)
  --created, -c      ISO timestamp of creation (default: current time)
  --updated, -u      ISO timestamp of last update (default: current time)
  --json, -j         Output as formatted JSON (default)
  --help, -h         Show this help message

Example:
  npx tsx scripts/parse-issue.ts issue.md --number 2 \\
    --created 2026-02-03T18:34:20Z \\
    --updated 2026-02-03T18:34:20Z
    `);
    process.exit(0);
  }

  const filePath = args[0];
  if (!filePath) {
    console.error("Error: issue-body-file argument is required");
    console.error("Use --help for usage information");
    process.exit(1);
  }

  try {
    const fs = await import("node:fs");
    const issueBody = fs.readFileSync(filePath, "utf-8");

    const getArg = (flags: string[]): string | undefined => {
      for (const flag of flags) {
        const idx = args.indexOf(flag);
        if (idx !== -1 && idx + 1 < args.length) {
          return args[idx + 1];
        }
      }
      return undefined;
    };

    const issueNumber = parseInt(getArg(["--number", "-n"]) || "0", 10);
    const createdAt = getArg(["--created", "-c"]) || new Date().toISOString();
    const updatedAt = getArg(["--updated", "-u"]) || new Date().toISOString();

    if (!issueNumber) {
      console.error("Error: --number is required");
      process.exit(1);
    }

    const result = parseIssueBody(issueBody, issueNumber, createdAt, updatedAt);

    if (result) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error("Error: Failed to parse issue body");
      process.exit(1);
    }
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
