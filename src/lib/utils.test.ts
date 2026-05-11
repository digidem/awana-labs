import { describe, it, expect, vi } from "vitest";
import { formatRelativeTime } from "@/lib/utils";

const t = vi.fn((key: string, options?: Record<string, unknown>) =>
  JSON.stringify({ key, ...options }),
);

const daysAgo = (n: number) =>
  new Date(Date.now() - n * 86400000).toISOString();
const weeksAgo = (n: number) =>
  new Date(Date.now() - n * 7 * 86400000).toISOString();
const monthsAgo = (n: number) =>
  new Date(Date.now() - n * 30 * 86400000).toISOString();
const yearsAgo = (n: number) =>
  new Date(Date.now() - n * 365 * 86400000).toISOString();
const daysFromNow = (n: number) =>
  new Date(Date.now() + n * 86400000).toISOString();
const yearsFromNow = (n: number) =>
  new Date(Date.now() + n * 365 * 86400000).toISOString();

describe("formatRelativeTime", () => {
  it("returns raw value for invalid date string", () => {
    expect(formatRelativeTime("not-a-date", "en", t)).toBe("not-a-date");
  });

  it("returns 'today' for today's date", () => {
    expect(formatRelativeTime(daysAgo(0), "en", t)).toBe("today");
  });

  it("returns 'yesterday' for yesterday", () => {
    expect(formatRelativeTime(daysAgo(1), "en", t)).toBe("yesterday");
  });

  it("returns 'X days ago' for dates within a week", () => {
    expect(formatRelativeTime(daysAgo(3), "en", t)).toBe("3 days ago");
    expect(formatRelativeTime(daysAgo(5), "en", t)).toBe("5 days ago");
  });

  it("returns 'last week' / 'X weeks ago' for dates 1-4 weeks ago", () => {
    expect(formatRelativeTime(weeksAgo(1), "en", t)).toBe("last week");
    expect(formatRelativeTime(weeksAgo(2), "en", t)).toBe("2 weeks ago");
    expect(formatRelativeTime(weeksAgo(4), "en", t)).toBe("4 weeks ago");
  });

  it("returns 'X months ago' for dates 1-11 months ago", () => {
    // monthsAgo uses 30-day units; 1 month = 30 days falls in weeks bucket,
    // so use 2+ months to land in the months range (|diffWeeks| >= 5).
    expect(formatRelativeTime(monthsAgo(2), "en", t)).toBe("2 months ago");
    expect(formatRelativeTime(monthsAgo(3), "en", t)).toBe("3 months ago");
    expect(formatRelativeTime(monthsAgo(11), "en", t)).toBe("11 months ago");
  });

  it("returns overYears translation for 12+ months", () => {
    const result = formatRelativeTime(yearsAgo(1), "en", t);
    expect(result).toContain("timeAgo.overYears");
    expect(result).toContain('"count"');
  });

  it("returns overYears translation with correct year count for multiple years", () => {
    const result = formatRelativeTime(yearsAgo(3), "en", t);
    expect(result).toContain("timeAgo.overYears");
    expect(result).toContain("3");
  });

  it("works with different locales", () => {
    expect(formatRelativeTime(daysAgo(0), "pt", t)).toBe("hoje");
    expect(formatRelativeTime(daysAgo(1), "es", t)).toBe("ayer");
  });

  it("handles future dates", () => {
    expect(formatRelativeTime(daysFromNow(1), "en", t)).toBe("tomorrow");
    expect(formatRelativeTime(daysFromNow(3), "en", t)).toBe("in 3 days");
  });

  it("handles future dates beyond 12 months using Intl.RelativeTimeFormat", () => {
    const result = formatRelativeTime(yearsFromNow(2), "en", t);
    // Future dates >12 months use rtf.format (positive value) which
    // produces "in 2 years" via Intl.RelativeTimeFormat.
    expect(result).toBe("in 2 years");
  });

  // Past 12+ months: implementation uses i18n key (timeAgo.overYears),
  // NOT rtf.format, because rtf.format with negative years produces
  // "2 years ago" — lacking the "over" qualifier the i18n key provides.
  it("past 12+ months uses i18n key with correct count, not rtf.format", () => {
    const result = formatRelativeTime(yearsAgo(1), "en", t);
    expect(result).toContain("timeAgo.overYears");
    expect(result).toContain("1");
    // Should NOT be rtf.format output like "1 year ago"
    expect(result).not.toBe("1 year ago");
  });

  it("exactly 12 months in the future uses rtf.format", () => {
    const result = formatRelativeTime(daysFromNow(365), "en", t);
    // 365 days from now → diffDays >= 0 → rtf.format path
    // numeric: "auto" produces "next year" for +1 year
    expect(result).toBe("next year");
  });
});
