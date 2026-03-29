/**
 * Project Schema Validation with Zod
 *
 * Runtime type validation for project data structures.
 * Provides Zod schemas for validating project data from external sources
 * (GitHub issue fetches, browser localStorage cache, user input).
 *
 * Usage:
 *   import { projectSchema, projectsDataSchema } from '@/types/project.schema';
 *   const result = projectSchema.parse(data);
 *   const safeResult = projectSchema.safeParse(data);
 */

import { z } from "zod";

// ============================================================================
// Enum-like Literals for Type Safety
// ============================================================================

/**
 * Project state enumeration
 * - active: Currently being developed and maintained
 * - paused: Temporarily suspended, may resume
 * - archived: No longer maintained, kept for reference
 */
export const ProjectStateEnum = z.enum(["active", "paused", "archived"]);
export type ProjectState = z.infer<typeof ProjectStateEnum>;

/**
 * Project usage level enumeration
 * - experimental: Early stage, experimental use
 * - used: Used in specific contexts/deployments
 * - widely-used: Used across multiple deployments/projects
 */
export const ProjectUsageEnum = z.enum(["experimental", "used", "widely-used"]);
export type ProjectUsage = z.infer<typeof ProjectUsageEnum>;

// ============================================================================
// Organization Schema
// ============================================================================

/**
 * Organization information schema
 */
export const organizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  short_name: z
    .string()
    .min(1, "Organization short name is required")
    .max(50, "Short name must be 50 characters or less"),
  url: z.string().url("Organization URL must be a valid URL"),
});

export type Organization = z.infer<typeof organizationSchema>;

// ============================================================================
// Status Schema
// ============================================================================

/**
 * Project status information schema
 */
export const statusSchema = z.object({
  state: ProjectStateEnum,
  usage: ProjectUsageEnum,
  notes: z.string().default(""),
});

export type Status = z.infer<typeof statusSchema>;

// ============================================================================
// Shared URL Helpers
// ============================================================================

/**
 * Helper: accepts a valid URL or an empty string.
 * Used for optional URL fields that default to "" when absent.
 */
const optionalUrl = (label: string) =>
  z
    .string()
    .refine((val) => val === "" || z.string().url().safeParse(val).success, {
      message: `${label} must be a valid URL`,
    })
    .default("");

// ============================================================================
// Media Schema
// ============================================================================

/**
 * Project media assets schema
 */
export const mediaSchema = z.object({
  logo: optionalUrl("Logo"),
  images: z.array(z.string().url("Image URLs must be valid")).default([]),
});

export type Media = z.infer<typeof mediaSchema>;

// ============================================================================
// Links Schema
// ============================================================================

/**
 * Project links schema
 * At minimum, homepage is required
 */
export const linksSchema = z.object({
  homepage: z.string().url("Homepage must be a valid URL"),
  repository: optionalUrl("Repository"),
  documentation: optionalUrl("Documentation"),
});

export type Links = z.infer<typeof linksSchema>;

// ============================================================================
// Timestamps Schema
// ============================================================================

/**
 * Project timestamps schema
 * ISO 8601 datetime strings
 */
export const timestampsSchema = z.object({
  created_at: z
    .string()
    .datetime("Created at must be a valid ISO 8601 datetime"),
  last_updated_at: z
    .string()
    .datetime("Last updated at must be a valid ISO 8601 datetime"),
});

export type Timestamps = z.infer<typeof timestampsSchema>;

// ============================================================================
// Project Schema
// ============================================================================

/**
 * Complete project schema
 * Main data structure for project information
 */
export const projectSchema = z.object({
  id: z.string().min(1, "Project ID is required"),
  issue_number: z
    .number()
    .int()
    .positive("Issue number must be a positive integer"),
  title: z
    .string()
    .min(1, "Project title is required")
    .max(200, "Title must be 200 characters or less"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens",
    ),
  description: z
    .string()
    .min(1, "Description is required")
    .max(2000, "Description must be 2000 characters or less"),
  organization: organizationSchema,
  status: statusSchema,
  tags: z
    .array(z.string().min(1))
    .default([])
    .refine((tags) => tags.every((tag) => tag.length <= 50), {
      message: "All tags must be 50 characters or less",
    }),
  media: mediaSchema,
  links: linksSchema,
  timestamps: timestampsSchema,
});

export type Project = z.infer<typeof projectSchema>;

// ============================================================================
// Projects Data Schema
// ============================================================================

/**
 * Container schema for projects array
 * Matches the runtime projects payload returned from GitHub-backed fetches
 * and persisted in browser localStorage.
 */
export const projectsDataSchema = z.object({
  projects: z.array(projectSchema),
});

export type ProjectsData = z.infer<typeof projectsDataSchema>;

// ============================================================================
// Partial Schemas for Updates/Patches
// ============================================================================

/**
 * Partial project schema for updates
 * All fields optional
 */
export const projectUpdateSchema = projectSchema.partial();

export type ProjectUpdate = z.infer<typeof projectUpdateSchema>;

/**
 * Project creation schema (without id, issue_number, timestamps)
 * For creating new projects before they have IDs
 */
export const projectCreateSchema = projectSchema
  .omit({
    id: true,
    issue_number: true,
    timestamps: true,
  })
  .extend({
    timestamps: timestampsSchema.partial().optional(),
  });

export type ProjectCreate = z.infer<typeof projectCreateSchema>;

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Safely validate project data
 * Returns result object with success status and data or error
 */
export function validateProject(data: unknown) {
  return projectSchema.safeParse(data);
}

/**
 * Safely validate projects data array
 * Returns result object with success status and data or error
 */
export function validateProjectsData(data: unknown) {
  return projectsDataSchema.safeParse(data);
}

/**
 * Validate and return project data, throwing on error
 */
export function parseProject(data: unknown): Project {
  return projectSchema.parse(data);
}

/**
 * Validate and return projects data, throwing on error
 */
export function parseProjectsData(data: unknown): ProjectsData {
  return projectsDataSchema.parse(data);
}

/**
 * Validate and return project data from a GitHub issue body
 * This is a helper that can be used with the parseIssueBody function
 */
export function validateParsedProject(data: unknown): Project | null {
  const result = projectSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  // Log validation errors for debugging
  if (result.error) {
    console.error("Project validation failed:", result.error.format());
  }
  return null;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if data is a valid Project
 */
export function isProject(data: unknown): data is Project {
  return projectSchema.safeParse(data).success;
}

/**
 * Type guard to check if data is a valid ProjectsData
 */
export function isProjectsData(data: unknown): data is ProjectsData {
  return projectsDataSchema.safeParse(data).success;
}

/**
 * Type guard to check if string is a valid ProjectState
 */
export function isValidProjectState(state: string): state is ProjectState {
  return ProjectStateEnum.safeParse(state).success;
}

/**
 * Type guard to check if string is a valid ProjectUsage
 */
export function isValidProjectUsage(usage: string): usage is ProjectUsage {
  return ProjectUsageEnum.safeParse(usage).success;
}
