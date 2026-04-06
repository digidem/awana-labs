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
import {
  slugify,
  extractSection,
  extractKeyValue,
  extractLogo,
  parseImages,
  parseTags,
  parseNotes,
  parseDescription,
} from "../src/lib/issue-parser.js";

// ============================================================================
// Type Definitions
// ============================================================================

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
type ProjectData = Project;

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
      usage: statusUsage || "experimental",
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
