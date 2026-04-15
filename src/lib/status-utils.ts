/**
 * Status utilities for project display
 * Centralized styling and label mappings for project status
 */

import type { ProjectState, ProjectUsage } from "@/types/project.schema";

// Re-export under legacy names for backward compatibility
export type { ProjectState as ProjectStatusState, ProjectUsage as ProjectStatusUsage } from "@/types/project.schema";

/**
 * Tailwind CSS classes for status badge styling
 */
export const statusColors: Record<ProjectState, string> = {
  active: "bg-green-500/10 text-green-700 border-green-500/20",
  paused: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  archived: "bg-muted text-muted-foreground border-border",
};

/**
 * Translation key mappings for usage status
 */
export const usageTranslationKeys: Record<ProjectUsage, string> = {
  experimental: "status.experimental",
  used: "status.used",
  "widely-used": "status.widelyUsed",
};

/**
 * Get status classes for a given status state
 * @param state - The project status state
 * @returns CSS class string for styling
 */
export function getStatusClasses(state: ProjectState): string {
  return statusColors[state];
}

/**
 * Get usage label for a given usage status
 * @param usage - The project usage status
 * @param t - Translation function from useTranslation hook
 * @returns Translated human-readable label
 */
export function getUsageLabel(
  usage: ProjectUsage,
  t: (key: string) => string,
): string {
  return t(usageTranslationKeys[usage]);
}
