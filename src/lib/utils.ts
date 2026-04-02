import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string as a human-readable relative time (e.g. "today",
 * "yesterday", "3 days ago", "last week", "2 months ago", "2 years ago").
 *
 * Uses the native `Intl.RelativeTimeFormat` API for full locale awareness.
 * Falls back to the raw string value when the date cannot be parsed.
 */
export function formatRelativeTime(
  dateValue: string,
  locale: string,
): string {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  // Up to 6 days → "today" / "yesterday" / "3 days ago"
  if (Math.abs(diffDays) < 7) {
    return rtf.format(diffDays, "day");
  }

  // Up to ~30 days → "last week" / "2 weeks ago"
  const diffWeeks = Math.round(diffDays / 7);
  if (Math.abs(diffWeeks) < 5) {
    return rtf.format(diffWeeks, "week");
  }

  // Up to ~24 months → "3 months ago"
  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 24) {
    return rtf.format(diffMonths, "month");
  }

  // Beyond that → "2 years ago"
  const diffYears = Math.round(diffDays / 365);
  return rtf.format(diffYears, "year");
}
