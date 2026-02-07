/**
 * Status utilities for project display
 * Centralized styling and label mappings for project status
 */

export type ProjectStatusState = "active" | "paused" | "archived";
export type ProjectStatusUsage = "experimental" | "used" | "widely-used";

/**
 * Tailwind CSS classes for status badge styling
 */
export const statusColors: Record<ProjectStatusState, string> = {
  active: "bg-green-500/10 text-green-700 border-green-500/20",
  paused: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  archived: "bg-muted text-muted-foreground border-border",
};

/**
 * Human-readable labels for usage status
 */
export const usageLabels: Record<ProjectStatusUsage, string> = {
  experimental: "Experimental",
  used: "In Use",
  "widely-used": "Widely Used",
};

/**
 * Get status classes for a given status state
 * @param state - The project status state
 * @returns CSS class string for styling
 */
export function getStatusClasses(state: ProjectStatusState): string {
  return statusColors[state];
}

/**
 * Get usage label for a given usage status
 * @param usage - The project usage status
 * @returns Human-readable label
 */
export function getUsageLabel(usage: ProjectStatusUsage): string {
  return usageLabels[usage];
}
