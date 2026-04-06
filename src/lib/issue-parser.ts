/**
 * Shared issue-body parsing utilities
 *
 * Used by both the runtime GitHub fetch path (`github-projects.ts`) and the
 * standalone CLI script (`scripts/parse-issue.ts`).
 */

// =============================================================================
// Types
// =============================================================================

/** Raw section content extracted from an issue body */
export interface SectionContent {
  raw: string;
  lines: string[];
}

// =============================================================================
// Utility Functions
// =============================================================================

/** Escape special regex characters */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Check whether a string looks like a URL */
export function isUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

/**
 * Slugify a string for URL-safe identifiers
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Extract a section from markdown body by heading name.
 * Handles `#`, `##`, `###` headings and horizontal-rule separators.
 */
export function extractSection(
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
 * Extract a key-value pair from section content.
 * Handles `**Key:** value` and `Key: value` formats, including values on the
 * next line after the key.
 */
export function extractKeyValue(
  section: SectionContent | null,
  key: string,
): string {
  if (!section) return "";

  const keyPattern = new RegExp(
    `^\\*\\*${escapeRegex(key)}\\*\\*:\\s*(.+)$|^\\*?\\*?${escapeRegex(key)}\\*?\\*?:\\s*(.+)$`,
    "im",
  );

  for (let i = 0; i < section.lines.length; i++) {
    const line = section.lines[i];
    const match = line.match(keyPattern);
    if (match) {
      let value = (match[1] || match[2] || "").trim();
      value = value.replace(/^\*\*|\*\*$/g, "").trim();
      if (!value && i + 1 < section.lines.length) {
        value = section.lines[i + 1].trim().replace(/^\*\*|\*\*$/g, "").trim();
      }
      return value;
    }
  }

  return "";
}

/**
 * Parse comma-separated tags from section content
 */
export function parseTags(section: SectionContent | null): string[] {
  if (!section || !section.raw) return [];
  return section.raw
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

/**
 * Extract logo URL or icon name from the media section.
 * Returns a URL if one is found, otherwise returns a plain icon name string.
 */
export function extractLogo(section: SectionContent | null): string {
  if (!section) return "";

  const logoIndex = section.lines.findIndex((line) => {
    const lower = line.toLowerCase();
    return lower.startsWith("**logo") && lower.indexOf("**") === 0;
  });

  if (logoIndex !== -1) {
    const logoLine = section.lines[logoIndex];
    const urlMatch = logoLine.match(/https?:\/\/[^\s]+/i);
    if (urlMatch) {
      return urlMatch[0].replace(/["')\]]+$/, "").trim();
    }

    const colonIdx = logoLine.indexOf(":");
    if (colonIdx !== -1) {
      const rawValue = logoLine
        .slice(colonIdx + 1)
        .trim()
        .replace(/^\*\*|\*\*$/g, "")
        .replace(/["')\]]+$/, "")
        .trim();
      if (rawValue) return rawValue;
    }

    if (logoIndex + 1 < section.lines.length) {
      const nextUrlMatch = section.lines[logoIndex + 1].match(/https?:\/\/[^\s]+/i);
      if (nextUrlMatch) {
        return nextUrlMatch[0].replace(/["')\]]+$/, "").trim();
      }
      const nextLine = section.lines[logoIndex + 1].trim();
      if (nextLine && !isUrl(nextLine)) {
        return nextLine;
      }
    }
  }

  return "";
}

/**
 * Parse image URLs from section content (excluding the logo URL).
 */
export function parseImages(section: SectionContent | null): string[] {
  if (!section || !section.raw) return [];

  const urls: string[] = [];
  const logoUrl = extractLogo(section);

  const imagesIndex = section.lines.findIndex((line) =>
    line.toLowerCase().startsWith("**images"),
  );

  const startIndex = imagesIndex !== -1 ? imagesIndex + 1 : 0;
  const searchText = section.lines.slice(startIndex).join("\n");

  const urlPattern = /https?:\/\/[^\s]+/gi;
  for (const match of searchText.matchAll(urlPattern)) {
    const url = match[0].replace(/["')\]]+$/, "").trim();
    if (url && url !== logoUrl) {
      urls.push(url);
    }
  }

  return urls;
}

/**
 * Parse multi-line notes from a status section.
 * Notes may span multiple lines after the `**Notes:**` marker.
 */
export function parseNotes(section: SectionContent | null): string {
  if (!section || !section.raw) return "";

  const lines = section.lines;
  const notesIndex = lines.findIndex((line) =>
    line.toLowerCase().startsWith("**notes"),
  );

  if (notesIndex === -1) return "";

  // Collect all lines after the Notes marker until another bold field
  const notesLines: string[] = [];
  for (let i = notesIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("**")) break;
    if (line.length > 0) notesLines.push(line);
  }

  // Also check for content on the same line as the marker
  const notesMarkerLine = lines[notesIndex];
  const colonIndex = notesMarkerLine.indexOf(":");
  let sameLineContent = "";
  if (colonIndex >= 0) {
    sameLineContent = notesMarkerLine
      .substring(colonIndex + 1)
      .trim()
      .replace(/\*+/g, "")
      .trim();
  }

  const allNotes = sameLineContent
    ? [sameLineContent, ...notesLines]
    : notesLines;
  return allNotes.join(" ").trim();
}

/**
 * Parse description from a section.
 * Reformats multi-line paragraphs with double newlines.
 */
export function parseDescription(section: SectionContent | null): string {
  if (!section || !section.raw) return "";

  return section.raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n\n");
}
