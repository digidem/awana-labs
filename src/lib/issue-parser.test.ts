import { describe, it, expect } from "vitest";
import {
  slugify,
  extractSection,
  extractKeyValue,
  parseTags,
  extractLogo,
  parseImages,
  parseNotes,
  parseDescription,
} from "@/lib/issue-parser";

describe("slugify", () => {
  it("converts to lowercase", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("replaces spaces with hyphens", () => {
    expect(slugify("foo bar baz")).toBe("foo-bar-baz");
  });

  it("removes special characters", () => {
    expect(slugify("Hello! @World#")).toBe("hello-world");
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("foo   bar")).toBe("foo-bar");
  });

  it("handles already-slugified text", () => {
    expect(slugify("already-slugified")).toBe("already-slugified");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });

  it("handles text with leading/trailing spaces", () => {
    expect(slugify("  hello world  ")).toBe("-hello-world-");
  });

  it("preserves underscores and hyphens", () => {
    expect(slugify("hello_world-test")).toBe("hello_world-test");
  });
});

describe("extractSection", () => {
  it("extracts content under ## heading", () => {
    const body = "## Description\nSome content here\nMore text";
    const result = extractSection(body, "Description");
    expect(result).not.toBeNull();
    expect(result!.raw).toBe("Some content here\nMore text");
    expect(result!.lines).toEqual(["Some content here", "More text"]);
  });

  it("extracts content under # heading", () => {
    const body = "# Title\nContent under h1";
    const result = extractSection(body, "Title");
    expect(result).not.toBeNull();
    expect(result!.raw).toBe("Content under h1");
  });

  it("extracts content under ### heading", () => {
    const body = "### Subtitle\nContent under h3";
    const result = extractSection(body, "Subtitle");
    expect(result).not.toBeNull();
    expect(result!.raw).toBe("Content under h3");
  });

  it("returns null when section not found", () => {
    const body = "## Other\nSome content";
    expect(extractSection(body, "Missing")).toBeNull();
  });

  it("stops at next heading", () => {
    const body = "## First\nFirst content\n## Second\nSecond content";
    const result = extractSection(body, "First");
    expect(result).not.toBeNull();
    expect(result!.raw).toBe("First content");
  });

  it("stops at horizontal rule", () => {
    const body = "## Section\nSome content\n---\nAfter rule";
    const result = extractSection(body, "Section");
    expect(result).not.toBeNull();
    expect(result!.raw).toBe("Some content");
  });

  it("handles case-insensitive section name matching", () => {
    const body = "## My Section\nContent";
    expect(extractSection(body, "my section")).not.toBeNull();
    expect(extractSection(body, "MY SECTION")).not.toBeNull();
  });

  it("handles section with empty content", () => {
    const body = "## Empty\n## Next";
    const result = extractSection(body, "Empty");
    expect(result).not.toBeNull();
    expect(result!.raw).toBe("");
    expect(result!.lines).toEqual([]);
  });

  it("handles section with multi-line content", () => {
    const body = "## Details\nLine one\nLine two\nLine three";
    const result = extractSection(body, "Details");
    expect(result).not.toBeNull();
    expect(result!.lines).toEqual(["Line one", "Line two", "Line three"]);
  });

  it("trims lines in the lines array", () => {
    const body = "## Section\n  padded line  \n\ttabbed line\t";
    const result = extractSection(body, "Section");
    expect(result).not.toBeNull();
    expect(result!.lines).toEqual(["padded line", "tabbed line"]);
  });
});

describe("extractKeyValue", () => {
  it("extracts **Key:** value format", () => {
    const section = { raw: "**Name:** Acme", lines: ["**Name:** Acme"] };
    expect(extractKeyValue(section, "Name")).toBe("Acme");
  });

  it("extracts Key: value format without bold", () => {
    const section = { raw: "Name: Acme", lines: ["Name: Acme"] };
    expect(extractKeyValue(section, "Name")).toBe("Acme");
  });

  it("returns empty string for null section", () => {
    expect(extractKeyValue(null, "Name")).toBe("");
  });

  it("returns empty string when key not found", () => {
    const section = { raw: "**Other:** value", lines: ["**Other:** value"] };
    expect(extractKeyValue(section, "Missing")).toBe("");
  });

  it("extracts value from next line when value is on next line", () => {
    const section = {
      raw: "**Name:**\nAcme Corp",
      lines: ["**Name:**", "Acme Corp"],
    };
    expect(extractKeyValue(section, "Name")).toBe("Acme Corp");
  });

  it("handles key with special regex characters", () => {
    const section = {
      raw: "**URL (website):** https://example.com",
      lines: ["**URL (website):** https://example.com"],
    };
    expect(extractKeyValue(section, "URL (website)")).toBe(
      "https://example.com",
    );
  });

  it("strips trailing bold markers from value", () => {
    const section = {
      raw: "**Name:** **bold value**",
      lines: ["**Name:** **bold value**"],
    };
    expect(extractKeyValue(section, "Name")).toBe("**bold value");
  });
});

describe("parseTags", () => {
  it("parses comma-separated tags", () => {
    const section = { raw: "tag1, tag2, tag3", lines: ["tag1, tag2, tag3"] };
    expect(parseTags(section)).toEqual(["tag1", "tag2", "tag3"]);
  });

  it("trims whitespace from tags", () => {
    const section = { raw: "  tag1  ,  tag2  ", lines: ["  tag1  ,  tag2  "] };
    expect(parseTags(section)).toEqual(["tag1", "tag2"]);
  });

  it("filters empty tags", () => {
    const section = { raw: "tag1,, tag2, , tag3", lines: [] };
    expect(parseTags(section)).toEqual(["tag1", "tag2", "tag3"]);
  });

  it("returns empty array for null section", () => {
    expect(parseTags(null)).toEqual([]);
  });

  it("returns empty array for empty raw content", () => {
    const section = { raw: "", lines: [] };
    expect(parseTags(section)).toEqual([]);
  });

  it("handles single tag", () => {
    const section = { raw: "solo-tag", lines: ["solo-tag"] };
    expect(parseTags(section)).toEqual(["solo-tag"]);
  });

  it("handles tags with spaces", () => {
    const section = {
      raw: "tag with space, another tag",
      lines: ["tag with space, another tag"],
    };
    expect(parseTags(section)).toEqual(["tag with space", "another tag"]);
  });
});

describe("extractLogo", () => {
  it("extracts URL from **Logo:** line", () => {
    const section = {
      raw: "**Logo:** https://example.com/logo.png",
      lines: ["**Logo:** https://example.com/logo.png"],
    };
    expect(extractLogo(section)).toBe("https://example.com/logo.png");
  });

  it("extracts icon name from **Logo:** line", () => {
    const section = {
      raw: "**Logo:** icon-name",
      lines: ["**Logo:** icon-name"],
    };
    expect(extractLogo(section)).toBe("icon-name");
  });

  it("extracts URL from next line when logo value is on next line", () => {
    const section = {
      raw: "**Logo:**\nhttps://example.com/logo.png",
      lines: ["**Logo:**", "https://example.com/logo.png"],
    };
    expect(extractLogo(section)).toBe("https://example.com/logo.png");
  });

  it("returns empty string for null section", () => {
    expect(extractLogo(null)).toBe("");
  });

  it("returns empty string when no logo line found", () => {
    const section = {
      raw: "**Name:** Acme",
      lines: ["**Name:** Acme"],
    };
    expect(extractLogo(section)).toBe("");
  });

  it("strips trailing quotes/parens/brackets from URL", () => {
    const section = {
      raw: '**Logo:** https://example.com/logo.png")',
      lines: ['**Logo:** https://example.com/logo.png")'],
    };
    expect(extractLogo(section)).toBe("https://example.com/logo.png");
  });

  it("extracts plain icon name from colon-separated value", () => {
    const section = {
      raw: "**Logo:** my-icon-name",
      lines: ["**Logo:** my-icon-name"],
    };
    expect(extractLogo(section)).toBe("my-icon-name");
  });
});

describe("parseImages", () => {
  it("extracts image URLs excluding logo URL", () => {
    const section = {
      raw: "**Logo:** https://example.com/logo.png\n**Images:**\nhttps://example.com/img1.png",
      lines: [
        "**Logo:** https://example.com/logo.png",
        "**Images:**",
        "https://example.com/img1.png",
      ],
    };
    expect(parseImages(section)).toEqual(["https://example.com/img1.png"]);
  });

  it("returns empty array for null section", () => {
    expect(parseImages(null)).toEqual([]);
  });

  it("returns empty array for empty section", () => {
    const section = { raw: "", lines: [] };
    expect(parseImages(section)).toEqual([]);
  });

  it("finds URLs after **Images** marker", () => {
    const section = {
      raw: "**Images:**\nhttps://example.com/a.png\nhttps://example.com/b.png",
      lines: [
        "**Images:**",
        "https://example.com/a.png",
        "https://example.com/b.png",
      ],
    };
    expect(parseImages(section)).toEqual([
      "https://example.com/a.png",
      "https://example.com/b.png",
    ]);
  });

  it("finds all URLs when no **Images** marker", () => {
    const section = {
      raw: "https://example.com/a.png\nhttps://example.com/b.png",
      lines: ["https://example.com/a.png", "https://example.com/b.png"],
    };
    expect(parseImages(section)).toEqual([
      "https://example.com/a.png",
      "https://example.com/b.png",
    ]);
  });

  it("handles section with only logo and no other images", () => {
    const section = {
      raw: "**Logo:** https://example.com/logo.png",
      lines: ["**Logo:** https://example.com/logo.png"],
    };
    expect(parseImages(section)).toEqual([]);
  });
});

describe("parseNotes", () => {
  it("extracts notes after **Notes:** marker", () => {
    const section = {
      raw: "**Notes:**\nFirst note\nSecond note",
      lines: ["**Notes:**", "First note", "Second note"],
    };
    expect(parseNotes(section)).toBe("First note Second note");
  });

  it("handles notes on same line as marker", () => {
    const section = {
      raw: "**Notes:** Inline note here",
      lines: ["**Notes:** Inline note here"],
    };
    expect(parseNotes(section)).toBe("Inline note here");
  });

  it("handles multi-line notes", () => {
    const section = {
      raw: "**Notes:**\nLine one\nLine two\nLine three",
      lines: ["**Notes:**", "Line one", "Line two", "Line three"],
    };
    expect(parseNotes(section)).toBe("Line one Line two Line three");
  });

  it("returns empty string for null section", () => {
    expect(parseNotes(null)).toBe("");
  });

  it("returns empty string when no notes marker", () => {
    const section = {
      raw: "**Other:** value",
      lines: ["**Other:** value"],
    };
    expect(parseNotes(section)).toBe("");
  });

  it("stops at next bold field", () => {
    const section = {
      raw: "**Notes:**\nNote text\n**NextField:** value",
      lines: ["**Notes:**", "Note text", "**NextField:** value"],
    };
    expect(parseNotes(section)).toBe("Note text");
  });

  it("combines same-line and multi-line content", () => {
    const section = {
      raw: "**Notes:** Start here\nMore details\nEven more",
      lines: ["**Notes:** Start here", "More details", "Even more"],
    };
    expect(parseNotes(section)).toBe("Start here More details Even more");
  });
});

describe("parseDescription", () => {
  it("reformats paragraphs with double newlines", () => {
    const section = {
      raw: "Line one\nLine two\nLine three",
      lines: ["Line one", "Line two", "Line three"],
    };
    expect(parseDescription(section)).toBe(
      "Line one\n\nLine two\n\nLine three",
    );
  });

  it("returns empty string for null section", () => {
    expect(parseDescription(null)).toBe("");
  });

  it("returns empty string for empty section", () => {
    const section = { raw: "", lines: [] };
    expect(parseDescription(section)).toBe("");
  });

  it("handles single line description", () => {
    const section = { raw: "Just one line", lines: ["Just one line"] };
    expect(parseDescription(section)).toBe("Just one line");
  });

  it("handles multi-line description", () => {
    const section = {
      raw: "First paragraph\n\nSecond paragraph",
      lines: ["First paragraph", "", "Second paragraph"],
    };
    expect(parseDescription(section)).toBe(
      "First paragraph\n\nSecond paragraph",
    );
  });

  it("trims each line", () => {
    const section = {
      raw: "  padded  \n  also padded  ",
      lines: ["padded", "also padded"],
    };
    expect(parseDescription(section)).toBe("padded\n\nalso padded");
  });
});
