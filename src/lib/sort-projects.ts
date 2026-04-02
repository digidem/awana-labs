import type { Project } from "../types/project";

const USAGE_ORDER: Record<string, number> = {
  "widely-used": 0,
  used: 1,
  experimental: 2,
};

const STATE_ORDER: Record<string, number> = {
  active: 0,
  paused: 1,
  archived: 2,
};

function toTimestamp(date: string): number {
  const ts = new Date(date).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

export function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => {
    const usageDiff =
      (USAGE_ORDER[a.status.usage] ?? 2) - (USAGE_ORDER[b.status.usage] ?? 2);
    if (usageDiff !== 0) return usageDiff;

    const stateDiff =
      (STATE_ORDER[a.status.state] ?? 2) - (STATE_ORDER[b.status.state] ?? 2);
    if (stateDiff !== 0) return stateDiff;

    const dateA = a.repoMetadata?.pushed_at ?? a.timestamps.last_updated_at;
    const dateB = b.repoMetadata?.pushed_at ?? b.timestamps.last_updated_at;
    return toTimestamp(dateB) - toTimestamp(dateA);
  });
}
