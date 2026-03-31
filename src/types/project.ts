/**
 * Project Type Definitions
 *
 * Re-exports TypeScript types derived from Zod schemas.
 * The runtime validation schemas are defined in src/types/project.schema.ts
 *
 * For runtime validation, import from '@/types/project.schema':
 *   import { projectSchema, parseProjectsData } from '@/types/project.schema';
 *
 * For type-only usage, you can import from this file:
 *   import type { Project, ProjectsData } from '@/types/project';
 */

export type {
  Project,
  ProjectsData,
  Organization,
  Status,
  Media,
  Links,
  Timestamps,
  ProjectState,
  ProjectUsage,
} from "./project.schema";
