import { describe, it, expect } from "vitest";
import { parseIssueBody } from "../../../scripts/parse-issue";

describe("parse-issue", () => {
  it("should correctly parse a simple valid markdown issue body", () => {
    const validMarkdown = `# Awana Labs Showcase

## Description
A showcase of open source tools.

## Organization
**Name:** Awana Digital
**Short name:** Awana
**Website:** https://awanadigital.com

## Project Status
**State:** active
**Usage:** used

## Tags
react, typescript, open source

## Media
**Logo:** https://example.com/logo.png

## Links
**Homepage:** https://awana-labs.com
**Repository:** https://github.com/awana/labs
**Documentation:** https://docs.awana-labs.com
`;

    const result = parseIssueBody(
      validMarkdown,
      1,
      "2024-01-01T00:00:00Z",
      "2024-01-01T00:00:00Z",
    );

    expect(result).toBeDefined();
    expect(result?.title).toBe("Awana Labs Showcase");
    expect(result?.organization.name).toBe("Awana Digital");
    expect(result?.status.state).toBe("active");
    expect(result?.tags).toEqual(["react", "typescript", "open source"]);
  });
});
