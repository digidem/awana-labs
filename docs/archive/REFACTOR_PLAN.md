# Refactoring Plan - Awana Labs Showcase

> Documented: 2025-02-04
> Status: Ready for Implementation

## Overview

This document outlines recommended refactoring tasks prioritized by risk, dependencies, and execution order. The plan is organized into waves that can be executed sequentially or in parallel where appropriate.

## Execution Waves

### Wave 1: Foundation (Low Risk, No Dependencies)

_Timeline: 1-2 days | Parallelizable: Yes_

These tasks establish quality infrastructure and can be done independently.

| Priority | Task                                       | Risk | Files                                |
| -------- | ------------------------------------------ | ---- | ------------------------------------ |
| 1        | Enable TypeScript strict mode              | Low  | `tsconfig.json`, `tsconfig.app.json` |
| 2        | Add typecheck script to package.json       | Low  | `package.json`                       |
| 3        | Fix all TypeScript errors                  | Low  | All `.ts`, `.tsx` files              |
| 4        | Run and fix all ESLint warnings            | Low  | All `.ts`, `.tsx` files              |
| 5        | Create dedicated hooks directory structure | Low  | `src/hooks/`, new files              |

**Dependencies**: None
**Risks**: Breaking changes possible with strict mode; require testing after each change

---

### Wave 2: Code Consolidation (Medium Risk, Depends on Wave 1)

_Timeline: 2-3 days | Parallelizable: Partial_

Extract duplicated constants and consolidate shared logic.

| Priority | Task                                                      | Risk | Files                                           |
| -------- | --------------------------------------------------------- | ---- | ----------------------------------------------- |
| 6        | Extract status constants to `src/constants/status.ts`     | Low  | New file, `ProjectCard.tsx`, `ProjectModal.tsx` |
| 7        | Extract usage labels to `src/constants/labels.ts`         | Low  | New file, `ProjectCard.tsx`, `ProjectModal.tsx` |
| 8        | Create shared project utilities in `src/lib/project.ts`   | Low  | New file, related components                    |
| 9        | Consolidate animation variants to `src/lib/animations.ts` | Low  | New file, multiple components                   |
| 10       | Create `src/constants/index.ts` barrel export             | Low  | New file                                        |

**Dependencies**: Wave 1 completion
**Risks**: Import path updates required; need to verify no missing exports

---

### Wave 3: Data Layer Refactoring (Medium Risk, Depends on Wave 2)

_Timeline: 2-3 days | Parallelizable: No_

Centralize data fetching and state management.

| Priority | Task                                           | Risk   | Files                      |
| -------- | ---------------------------------------------- | ------ | -------------------------- |
| 11       | Create `src/hooks/useProjects.ts` custom hook  | Medium | New file, `Index.tsx`      |
| 12       | Add error boundary component                   | Medium | New file, `App.tsx`        |
| 13       | Add loading skeleton component                 | Low    | New file, `Index.tsx`      |
| 14       | Implement proper error handling in useProjects | Medium | `src/hooks/useProjects.ts` |
| 15       | Add data fetching retry logic                  | Low    | `src/hooks/useProjects.ts` |

**Dependencies**: Wave 2 completion
**Risks**: State management changes require thorough testing; potential UX regressions

---

### Wave 4: Lovable Removal & Cleanup (Low Risk, No Dependencies)

_Timeline: 1 day | Parallelizable: Yes_

Remove Lovable-related artifacts and update to neutral placeholders.

| Priority | Task                                          | Risk | Files                            |
| -------- | --------------------------------------------- | ---- | -------------------------------- |
| 16       | Remove `lovable-tagger` from package.json     | Low  | `package.json`, `vite.config.ts` |
| 17       | Update GitHub issues to use Unsplash images   | Low  | `projects.json` (or data source) |
| 18       | Remove Lovable references from docs/comments  | Low  | Various files                    |
| 19       | Update project data with neutral placeholders | Low  | `projects.json`                  |

**Dependencies**: None (can be done in parallel with Wave 1)
**Risks**: Build configuration changes require verification

---

### Wave 5: Accessibility & Responsiveness (Medium Risk, No Dependencies)

_Timeline: 2-3 days | Parallelizable: Partial_

Improve accessibility coverage and fix responsiveness issues.

| Priority | Task                                            | Risk   | Files                                       |
| -------- | ----------------------------------------------- | ------ | ------------------------------------------- |
| 20       | Audit all components for ARIA attributes        | Low    | All components                              |
| 21       | Add missing aria-labels to interactive elements | Low    | `ProjectCard.tsx`, `ProjectModal.tsx`, etc. |
| 22       | Ensure keyboard navigation works everywhere     | Medium | `ProjectsGallery.tsx`, `ProjectModal.tsx`   |
| 23       | Fix responsiveness issues across breakpoints    | Medium | All components                              |
| 24       | Add focus-visible styling                       | Low    | Global CSS                                  |
| 25       | Test with screen reader and fix issues          | Medium | All components                              |

**Dependencies**: None (can be done in parallel with Waves 1-2)
**Risks**: Layout changes possible; need cross-browser testing

---

### Wave 6: Testing Infrastructure (Low Risk, No Dependencies)

_Timeline: 2-3 days | Parallelizable: Yes_

Build out test coverage for high-risk areas.

| Priority | Task                                    | Risk   | Files                                     |
| -------- | --------------------------------------- | ------ | ----------------------------------------- |
| 26       | Add tests for `useProjects` hook        | Low    | `src/hooks/useProjects.test.ts`           |
| 27       | Add tests for ProjectCard component     | Low    | `src/components/ProjectCard.test.tsx`     |
| 28       | Add tests for ProjectModal component    | Low    | `src/components/ProjectModal.test.tsx`    |
| 29       | Add tests for ProjectsGallery filtering | Low    | `src/components/ProjectsGallery.test.tsx` |
| 30       | Add E2E test for critical user flows    | Medium | `e2e/critical-flow.spec.ts`               |
| 31       | Remove or consolidate flaky tests       | Low    | Test files                                |

**Dependencies**: Wave 3 completion (for hook tests)
**Risks**: None significant

---

### Wave 7: Git Hooks & CI Enhancement (Low Risk, No Dependencies)

_Timeline: 1 day | Parallelizable: Yes_

Set up Husky for pre-commit hooks.

| Priority | Task                                       | Risk | Files                             |
| -------- | ------------------------------------------ | ---- | --------------------------------- |
| 32       | Install and configure Husky                | Low  | `.husky/`, `package.json`         |
| 33       | Add prepare script to package.json         | Low  | `package.json`                    |
| 34       | Configure lint-staged                      | Low  | `package.json` or `.lintstagedrc` |
| 35       | Add pre-commit hook for lint               | Low  | `.husky/pre-commit`               |
| 36       | Add pre-push hook for typecheck (optional) | Low  | `.husky/pre-push`                 |
| 37       | Document hook bypass in README             | Low  | `README.md`                       |

**Dependencies**: None (can be done anytime)
**Risks**: None significant

---

### Wave 8: i18n Implementation (High Risk, Depends on Previous Waves)

_Timeline: 3-5 days | Parallelizable: No_

Implement internationalization with i18next.

| Priority | Task                                          | Risk   | Files                                 |
| -------- | --------------------------------------------- | ------ | ------------------------------------- |
| 38       | Install i18next dependencies                  | Low    | `package.json`                        |
| 39       | Configure i18next with language detector      | Medium | `src/lib/i18n.ts`                     |
| 40       | Create translation file structure             | Low    | `src/locales/`                        |
| 41       | Add en/pt/es translations                     | Medium | `src/locales/*/`                      |
| 42       | Build language switcher component             | Medium | `src/components/LanguageSwitcher.tsx` |
| 43       | Integrate switcher into navigation            | Medium | `App.tsx` or header component         |
| 44       | Replace hardcoded strings with useTranslation | High   | All components with user-facing text  |
| 45       | Test locale switching functionality           | Medium | Manual testing                        |

**Dependencies**: Waves 1-3 recommended (cleaner codebase before i18n)
**Risks**: High - extensive string replacement, potential UI breakage, requires careful testing

---

### Wave 9: Octokit Migration (Medium Risk, No Dependencies)

_Timeline: 1-2 days | Parallelizable: Yes_

Migrate from raw fetch to Octokit.js for GitHub API.

| Priority | Task                              | Risk   | Files               |
| -------- | --------------------------------- | ------ | ------------------- |
| 46       | Install @octokit/core             | Low    | `package.json`      |
| 47       | Create GitHub API client wrapper  | Medium | `src/lib/github.ts` |
| 48       | Replace fetch calls with Octokit  | Medium | Data fetching files |
| 49       | Add error handling for API limits | Medium | `src/lib/github.ts` |
| 50       | Document Octokit usage            | Low    | Documentation       |

**Dependencies**: None (but easier after Wave 3)
**Risks**: Medium - API changes require testing, rate limiting considerations

---

## Dependency Graph

```
Wave 4 (Lovable Removal) ─────────────┐
Wave 7 (Git Hooks) ──────────────────┤
Wave 5 (Accessibility) ───────────────┤──┐
                                       │  │
Wave 1 (Foundation) ───────────────────┘  │
         │                               │
         ▼                               │
Wave 2 (Code Consolidation) ─────────────┘
         │
         ▼
Wave 3 (Data Layer) ──────┐
         │                │
         ▼                │
Wave 6 (Testing) ◄────────┘
         │
         ▼
Wave 8 (i18n) ────────────┐
         │                │
Wave 9 (Octokit) ◄────────┘
```

## Risk Assessment Summary

| Risk Level | Count | Waves                      |
| ---------- | ----- | -------------------------- |
| Low        | 29    | 1, 2, 4, 6, 7, 9 (partial) |
| Medium     | 18    | 3, 5, 8, 9                 |
| High       | 1     | 8                          |

## Parallel Execution Opportunities

**Can be done in parallel with Wave 1:**

- Wave 4: Lovable removal
- Wave 5: Accessibility audit
- Wave 7: Git hooks setup

**Can be done in parallel with Wave 2:**

- Wave 5: Accessibility fixes
- Wave 6: Basic component tests

## Rollback Strategy

Each wave should be committed separately. If issues arise:

1. Waves 1-2: Revert individual commits
2. Wave 3: Revert to Wave 2 baseline
3. Wave 8: Feature flag i18n for gradual rollout

## Verification Checklist

After each wave, run:

- [ ] `npm run typecheck` (if typecheck script exists)
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `npm run test:e2e` (or relevant subset)
- [ ] Manual smoke test of critical user flows

## Notes

- Type safety improvements (Wave 1) will make all subsequent changes safer
- Consolidating constants (Wave 2) reduces i18n effort (Wave 8)
- Accessibility improvements (Wave 5) benefit all users immediately
- Testing (Wave 6) provides safety net for i18n string replacements
