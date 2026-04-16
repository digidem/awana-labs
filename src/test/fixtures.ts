/**
 * Shared test fixtures for unit tests
 *
 * Provides factory functions for creating mock project data
 * that matches the Project schema from project.schema.ts.
 */

import type { Project, ProjectsData } from "@/types/project.schema";

/**
 * Default mock project matching the Project schema.
 * Use overrides to customize specific fields for each test.
 */
const defaultMockProject: Project = {
  id: "test-project",
  issue_number: 1,
  title: "Test Project",
  slug: "test-project",
  description: "A test project",
  organization: {
    name: "Test Org",
    short_name: "Test",
    url: "https://example.com",
  },
  status: {
    state: "active",
    usage: "experimental",
    notes: "",
  },
  tags: ["test"],
  media: {
    logo: "https://example.com/logo.png",
    images: [],
  },
  links: {
    homepage: "https://example.com",
    repository: "https://github.com/test/repo",
    documentation: "https://docs.example.com",
  },
  timestamps: {
    created_at: "2024-01-01T00:00:00.000Z",
    last_updated_at: "2024-01-02T00:00:00.000Z",
  },
};

/**
 * Create a mock project with optional partial overrides.
 *
 * Note: overrides are shallow-merged. Nested objects (e.g. `organization`,
 * `status`, `media`, `links`, `timestamps`) must be provided in full —
 * partial nested objects will replace the default entirely.
 *
 * @example
 * createMockProject({ title: "Custom Title", tags: ["a", "b"] })
 */
export function createMockProject(overrides: Partial<Project> = {}): Project {
  return { ...defaultMockProject, ...overrides };
}

/**
 * Create mock projects data (the container type) with optional project overrides.
 *
 * @example
 * createMockProjectsData({ title: "Custom Title" })
 */
export function createMockProjectsData(
  overrides: Partial<Project> = {},
): ProjectsData {
  return {
    projects: [createMockProject(overrides)],
  };
}
