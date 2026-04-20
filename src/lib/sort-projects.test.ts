import { describe, it, expect } from "vitest";
import { sortProjects } from "./sort-projects";
import { createMockProject } from "@/test/fixtures";

describe("sortProjects", () => {
  it("orders by usage priority: widely-used < used < experimental", () => {
    const experimental = createMockProject({
      id: "exp",
      status: { state: "active", usage: "experimental", notes: "" },
    });
    const used = createMockProject({
      id: "used",
      status: { state: "active", usage: "used", notes: "" },
    });
    const widelyUsed = createMockProject({
      id: "widely",
      status: { state: "active", usage: "widely-used", notes: "" },
    });

    const result = sortProjects([experimental, used, widelyUsed]);

    expect(result.map((p) => p.id)).toEqual(["widely", "used", "exp"]);
  });

  it("orders by state priority: active < paused < archived when usage is the same", () => {
    const archived = createMockProject({
      id: "archived",
      status: { state: "archived", usage: "used", notes: "" },
    });
    const paused = createMockProject({
      id: "paused",
      status: { state: "paused", usage: "used", notes: "" },
    });
    const active = createMockProject({
      id: "active",
      status: { state: "active", usage: "used", notes: "" },
    });

    const result = sortProjects([archived, paused, active]);

    expect(result.map((p) => p.id)).toEqual(["active", "paused", "archived"]);
  });

  it("orders by most recent date first when usage and state are the same", () => {
    const older = createMockProject({
      id: "older",
      timestamps: {
        ...createMockProject().timestamps,
        last_updated_at: "2024-01-01T00:00:00.000Z",
      },
    });
    const newer = createMockProject({
      id: "newer",
      timestamps: {
        ...createMockProject().timestamps,
        last_updated_at: "2024-06-15T00:00:00.000Z",
      },
    });

    const result = sortProjects([older, newer]);

    expect(result.map((p) => p.id)).toEqual(["newer", "older"]);
  });

  it("returns stable order when usage, state, and date are identical", () => {
    const base = {
      status: { state: "active" as const, usage: "used" as const, notes: "" },
      timestamps: {
        created_at: "2024-01-01T00:00:00.000Z",
        last_updated_at: "2024-03-01T00:00:00.000Z",
      },
    };
    const a = createMockProject({ id: "a", ...base });
    const b = createMockProject({ id: "b", ...base });
    const c = createMockProject({ id: "c", ...base });

    const result = sortProjects([a, b, c]);

    expect(result.map((p) => p.id)).toEqual(["a", "b", "c"]);
  });

  it("falls back to timestamps.last_updated_at when repoMetadata is missing", () => {
    const noRepo = createMockProject({
      id: "no-repo",
      timestamps: {
        created_at: "2024-01-01T00:00:00.000Z",
        last_updated_at: "2024-05-01T00:00:00.000Z",
      },
    });
    const withRepo = createMockProject({
      id: "with-repo",
      timestamps: {
        created_at: "2024-01-01T00:00:00.000Z",
        last_updated_at: "2024-01-01T00:00:00.000Z",
      },
      repoMetadata: {
        pushed_at: "2024-02-01T00:00:00.000Z",
        stargazers_count: 0,
        forks_count: 0,
      },
    });

    const result = sortProjects([noRepo, withRepo]);

    expect(result.map((p) => p.id)).toEqual(["no-repo", "with-repo"]);
  });

  it("does not crash on invalid dates and treats them as epoch 0", () => {
    const valid = createMockProject({
      id: "valid",
      timestamps: {
        created_at: "2024-01-01T00:00:00.000Z",
        last_updated_at: "2024-06-01T00:00:00.000Z",
      },
    });
    const invalid = createMockProject({
      id: "invalid",
      timestamps: {
        created_at: "not-a-date",
        last_updated_at: "also-not-a-date",
      },
    });

    const result = sortProjects([invalid, valid]);

    expect(result.map((p) => p.id)).toEqual(["valid", "invalid"]);
  });

  it("returns an empty array when given an empty array", () => {
    expect(sortProjects([])).toEqual([]);
  });

  it("returns a single-element array unchanged", () => {
    const project = createMockProject({ id: "solo" });
    const result = sortProjects([project]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("solo");
  });

  it("treats unknown usage values as lowest priority (same as experimental)", () => {
    const known = createMockProject({
      id: "known",
      status: { state: "active", usage: "experimental", notes: "" },
    });
    const unknown = createMockProject({
      id: "unknown",
      status: {
        state: "active",
        usage: "unknown-usage" as "experimental",
        notes: "",
      },
    });

    const result = sortProjects([known, unknown]);

    expect(result.map((p) => p.id)).toEqual(["known", "unknown"]);
  });

  it("treats unknown state values as lowest priority (same as archived)", () => {
    const known = createMockProject({
      id: "known",
      status: { state: "archived", usage: "used", notes: "" },
    });
    const unknown = createMockProject({
      id: "unknown",
      status: { state: "unknown-state" as "active", usage: "used", notes: "" },
    });

    const result = sortProjects([known, unknown]);

    expect(result.map((p) => p.id)).toEqual(["known", "unknown"]);
  });

  it("does not mutate the original array", () => {
    const a = createMockProject({ id: "a" });
    const b = createMockProject({ id: "b" });
    const original = [a, b];

    sortProjects(original);

    expect(original.map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("prefers repoMetadata.pushed_at over timestamps.last_updated_at for sorting", () => {
    const recentTimestamp = createMockProject({
      id: "recent-timestamp",
      timestamps: {
        created_at: "2024-01-01T00:00:00.000Z",
        last_updated_at: "2024-12-01T00:00:00.000Z",
      },
    });
    const oldRepoPush = createMockProject({
      id: "old-repo-push",
      timestamps: {
        created_at: "2024-01-01T00:00:00.000Z",
        last_updated_at: "2024-01-01T00:00:00.000Z",
      },
      repoMetadata: {
        pushed_at: "2024-02-01T00:00:00.000Z",
        stargazers_count: 0,
        forks_count: 0,
      },
    });

    const result = sortProjects([oldRepoPush, recentTimestamp]);

    expect(result.map((p) => p.id)).toEqual([
      "recent-timestamp",
      "old-repo-push",
    ]);
  });
});
