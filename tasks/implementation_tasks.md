# Implementation Task Backlog

Derived from repository investigation on 2026-03-25. This file replaces the generic audit checklist with bounded implementation tasks tied to the current codebase.

## Status Legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Done
- `[!]` Blocked or requires user approval

## Task Index

- `[x]` T0. Restore a reliable local test baseline.
- `[x]` T1. Stabilize E2E coverage against the current UI and data flow.
- `[x]` T2. Define the runtime GitHub-fetch plus local cache contract.
- `[x]` T3. Improve project loading, error, and offline UX.
- `[x]` T4. Fix project card and gallery interaction semantics.
- `[x]` T5. Harden the project modal state, focus behavior, and media loading.
- `[ ]` T6. Align language support, localization coverage, and date formatting.
- `[ ]` T7. Reduce scroll-driven rendering work in the header and hero background.
- `[!]` T8. Audit TypeScript and test/build configuration strictness.

## T0. Restore A Reliable Local Test Baseline

Status: `[x]`
Priority: P0
Files: `src/test/husky-setup.test.ts`, `src/test/i18n-translation.test.tsx`
Problem: `npm run test` is not currently a reliable gate. `src/test/husky-setup.test.ts` shells out to `npm run prepare` and fails in sandboxed environments with `spawnSync /bin/sh EPERM`, and `src/test/i18n-translation.test.tsx` emits React `act(...)` warnings during language-switching assertions.
Implementation:
- Replace the Husky test's shell-execution assertion with structural validation of the repository's Husky setup and hook contents.
- Update the i18n language-switching test to wrap state-changing language updates in `act(...)` and keep assertions tied to user-visible translated output.
- Keep both tests focused on repository guarantees and runtime behavior, not host-shell quirks.
Acceptance Criteria:
- `npm run test` exits successfully in the normal local environment.
- `src/test/husky-setup.test.ts` no longer invokes `npm run prepare` via `execSync`.
- `src/test/i18n-translation.test.tsx` no longer emits `act(...)` warnings.
Validation:
- `npm run test -- src/test/husky-setup.test.ts`
- `npm run test -- src/test/i18n-translation.test.tsx`
- `npm run test`
Dependencies:
- None.
Completion Note:
- Changed `src/test/husky-setup.test.ts`, `src/test/i18n-translation.test.tsx`; verified with `npm run test -- src/test/husky-setup.test.ts`, `npm run test -- src/test/i18n-translation.test.tsx`, and `npm run test`.

## T1. Stabilize E2E Coverage Against The Current UI And Data Flow

Status: `[x]`
Priority: P0
Files: `e2e/basic.spec.ts`, `e2e/responsive.spec.ts`, `e2e/projects.spec.ts`, `src/components/Header.tsx`, `src/components/ProjectsGallery.tsx`, `src/components/ProjectCard.tsx`, `src/components/ProjectModal.tsx`
Problem: The current Playwright suite encodes assumptions that do not match the app. `e2e/responsive.spec.ts` expects a language switcher and mobile menu that are commented out in `src/components/Header.tsx`. `e2e/projects.spec.ts` still targets `projects.json`, but the supported runtime contract is a GitHub-backed fetch with a validated `localStorage` cache and there is no real `projects.json` asset.
Implementation:
- Remove or rewrite assertions that depend on commented-out header features unless those features are intentionally restored.
- Replace fragile selectors like text-only matching and broad `[class*='project']` queries with stable role- and label-based selectors that match the rendered UI.
- Rework data assertions so they follow the supported runtime data source selected in T2.
- Test the cache contract intentionally: first-load fetch behavior, cached render behavior, and graceful fallback when cache is missing or stale.
- Keep responsive assertions focused on user-visible behavior, not Tailwind class names that may change without affecting behavior.
Acceptance Criteria:
- `e2e/responsive.spec.ts` no longer expects the header combobox or mobile menu unless the UI actually ships them.
- `e2e/basic.spec.ts` no longer contains `projects.json` request assumptions.
- `e2e/projects.spec.ts` no longer assumes `./projects.json` exists.
- At least one happy-path E2E test covers opening a project modal and closing it with a real accessible selector.
- At least one test covers rendering from the runtime cache contract chosen in T2.
- The updated E2E suite fails only on real regressions, not on stale product assumptions.
Validation:
- `npm run test:e2e -- e2e/responsive.spec.ts --project=chromium`
- `npm run test:e2e -- e2e/projects.spec.ts --project=chromium`
Dependencies:
- T2 for the final project-data assertions.
Environment Note:
- In the default sandbox, `vite preview` could not start the Playwright web server; verification was completed successfully outside the sandbox with the listed Playwright commands.
Completion Note:
- Changed `e2e/basic.spec.ts`, `e2e/projects.spec.ts`, and `e2e/responsive.spec.ts`; verified with `npm run test:e2e -- e2e/responsive.spec.ts --project=chromium`, `npm run test:e2e -- e2e/projects.spec.ts --project=chromium`, `npm run lint`, and `npm run typecheck`.

## T2. Define The Runtime GitHub-Fetch Plus Local Cache Contract

Status: `[x]`
Priority: P0
Files: `src/lib/api.ts`, `src/lib/api-cache.test.ts`, `src/lib/github-projects.ts`, `src/hooks/useProjects.ts`, `scripts/fetch-projects.ts`, `scripts/parse-issue.ts`, `src/types/project.schema.ts`, `e2e/projects.spec.ts`
Problem: The app currently mixes two incompatible stories: browser-side GitHub fetching in `src/lib/api.ts` and stale test assumptions about a static `projects.json` asset. The implementation decision is now explicit: there is no built-time or committed `projects.json`; instead, the app fetches validated project data from GitHub on cold start and persists that payload in `localStorage` for subsequent loads and offline fallback.
Implementation:
- Replace `projects.json` terminology with a real runtime cache contract based on `localStorage`.
- Keep schema validation at the fetch/cache boundary so malformed data never reaches UI components or persistent storage.
- Define cache behavior explicitly: cache key, versioning or invalidation strategy, stale-data policy, and fallback order for online and offline states.
- Keep GitHub issue parsing in the runtime fetch path only as needed by the chosen client contract.
- Add a dedicated cache-contract test file that covers cache miss, successful cache write, cache hit, invalid cached payload rejection, and offline fallback behavior.
- Remove or update remaining `projects.json` references in supporting scripts and code comments so the repository documents only the chosen runtime contract.
- Update dependent tests to validate the chosen contract instead of the current mixed model.
Acceptance Criteria:
- The supported runtime contract is explicit in code and documentation: fetch from GitHub on first successful load, validate, persist in `localStorage`, then reuse the cached payload when appropriate.
- The app no longer references a removed or hypothetical `projects.json` asset.
- Validation still runs through `parseProjectsData` or equivalent schema checks before data reaches UI components or `localStorage`.
- Tests cover at least one cold-start fetch path and one cached-data path.
Validation:
- `npm run test -- src/lib/api.test.ts`
- `npm run test -- src/lib/api-cache.test.ts`
- `npm run test -- src/hooks/useProjects.test.tsx`
- `npm run lint`
- `npm run typecheck`
Dependencies:
- None.
Notes:
- This task is intentionally client-cache based. Do not introduce `public/projects.json`, build-time data generation, or deploy-time artifact generation unless the product decision changes.
- This approach keeps a cold-start dependency on GitHub availability and rate limits. That is an accepted tradeoff for this implementation plan, not an unresolved ambiguity.
Completion Note:
- Changed `src/lib/api.ts`, `src/lib/api.test.ts`, `src/lib/api-cache.test.ts`, `src/lib/github-projects.ts`, `src/hooks/useProjects.ts`, `src/hooks/useProjects.test.tsx`, `scripts/fetch-projects.ts`, `scripts/parse-issue.ts`, `src/types/project.schema.ts`, `e2e/basic.spec.ts`, and `e2e/projects.spec.ts`; verified with `npm run test -- src/lib/api.test.ts`, `npm run test -- src/lib/api-cache.test.ts`, `npm run test -- src/hooks/useProjects.test.tsx`, `npm run lint`, `npm run typecheck`, and `npm run test`. Playwright execution remains blocked in this sandbox by the preview-server limitation already documented under T1.

## T3. Improve Project Loading, Error, And Offline UX

Status: `[x]`
Priority: P0
Files: `src/pages/Index.tsx`, `src/hooks/useProjects.ts`, `src/lib/api.ts`, `src/locales/en/common.json`, `src/locales/pt/common.json`, `src/locales/es/common.json`
Problem: The loading and error UI in `src/pages/Index.tsx` is hardcoded in English, and the error recovery path reloads the entire page instead of using the existing query refetch capability. `src/lib/api.ts` also exports `isOnline()` but the app does not use it.
Implementation:
- Replace hardcoded loading and error copy with translation keys.
- Use query refetch for retry instead of `window.location.reload()`.
- Distinguish between offline, timeout, and generic fetch failures when presenting user-facing errors.
- Add a lightweight offline-aware state when project loading fails and the browser reports offline status.
Acceptance Criteria:
- Loading and error states are localized.
- Retry uses the TanStack Query refetch path.
- Offline users see a specific message instead of a generic failure state.
- Tests cover at least one error path and one retry path.
Validation:
- `npm run test -- src/hooks/useProjects.test.tsx`
- `npm run test`
- `npm run lint`
- `npm run typecheck`
Dependencies:
- T2 may change the exact error source, but this task can start with the current hook contract.
Completion Note:
- Changed `src/lib/api.ts`, `src/hooks/useProjects.ts`, `src/hooks/useProjects.test.tsx`, `src/pages/Index.tsx`, `src/pages/Index.test.tsx`, `src/locales/en/common.json`, `src/locales/pt/common.json`, and `src/locales/es/common.json`; verified with `npm run test -- src/hooks/useProjects.test.tsx`, `npm run test -- src/pages/Index.test.tsx`, `npm run test`, `npm run lint`, and `npm run typecheck`.

## T4. Fix Project Card And Gallery Interaction Semantics

Status: `[x]`
Priority: P0
Files: `src/components/ProjectCard.tsx`, `src/components/ProjectsGallery.tsx`, `src/components/StatusBadge.tsx`, `src/locales/en/common.json`, `src/locales/pt/common.json`, `src/locales/es/common.json`
Problem: `src/components/ProjectCard.tsx` uses a generic card with `role="button"` and only handles the Enter key. `src/components/ProjectsGallery.tsx` has a search input with no visible or programmatic label and filter pills without pressed-state semantics.
Implementation:
- Convert project-card activation to a semantic interactive element with correct keyboard behavior.
- Add proper focus-visible styling for cards and filters.
- Add an accessible label for the search input.
- Add `aria-pressed`, radio-group semantics, or another explicit accessible state model for the status filters.
- Keep selectors stable enough that tests can target roles and labels instead of implementation details.
Acceptance Criteria:
- Project cards are reachable by keyboard and activate correctly with Enter and Space.
- The search field has an accessible name independent of placeholder text.
- Status filter controls expose selection state to assistive technology.
- Updated component tests verify keyboard and focus behavior.
Validation:
- `npm run test`
- `npm run lint`
- `npm run typecheck`
Dependencies:
- None.
Completion Note:
- Changed `src/components/ProjectCard.tsx`, `src/components/ProjectsGallery.tsx`, `src/components/ProjectCard.test.tsx`, `src/components/ProjectsGallery.test.tsx`, `src/locales/en/common.json`, `src/locales/pt/common.json`, and `src/locales/es/common.json`; verified with `npm run test -- src/components/ProjectCard.test.tsx`, `npm run test -- src/components/ProjectsGallery.test.tsx`, `npm run test`, `npm run lint`, and `npm run typecheck`.

## T5. Harden The Project Modal State, Focus Behavior, And Media Loading

Status: `[x]`
Priority: P0
Files: `src/components/ProjectModal.tsx`, `src/components/ProjectsGallery.tsx`, `src/locales/en/common.json`, `src/locales/pt/common.json`, `src/locales/es/common.json`
Problem: `src/components/ProjectModal.tsx` resets `currentImageIndex` during render, attaches document-level key handling, and does not manage focus on open or close. Remote images also render without loading hints, error fallbacks, or degraded states.
Implementation:
- Move project-change state resets into `useEffect`.
- Focus the modal or close button on open and restore focus to the invoking card on close.
- Keep Escape and arrow-key behavior scoped to the open modal.
- Add image loading and error fallbacks for remote project media.
- Preserve reduced-motion behavior while avoiding unnecessary animation work for modal image swaps.
Acceptance Criteria:
- No state updates happen during render.
- Opening the modal moves focus inside it; closing returns focus to the invoking element.
- Modal keyboard behavior works without leaking to the rest of the page.
- Broken or slow-loading images degrade gracefully without blank content.
Validation:
- `npm run test`
- `npm run lint`
- `npm run typecheck`
- `npm run test:e2e -- e2e/responsive.spec.ts --project=chromium --grep "project modal"`
Dependencies:
- T1 for the final E2E selector updates.
Completion Note:
- Changed `src/components/ProjectModal.tsx`, `src/components/ProjectModal.test.tsx`, `src/components/ProjectsGallery.tsx`, `src/components/ProjectCard.tsx`, `src/components/ProjectCard.test.tsx`, `src/locales/en/common.json`, `src/locales/pt/common.json`, and `src/locales/es/common.json`; verified with `npm run test -- src/components/ProjectModal.test.tsx`, `npm run test`, `npm run lint`, `npm run typecheck`, and `npm run test:e2e -- e2e/responsive.spec.ts --project=chromium --grep "project modal"`.

## T6. Align Language Support, Localization Coverage, And Date Formatting

Status: `[ ]`
Priority: P1
Files: `src/types/language.ts`, `src/hooks/useLanguage.tsx`, `src/lib/i18n.ts`, `src/components/ProjectCard.tsx`, `src/components/ProjectModal.tsx`, `src/pages/Index.tsx`, `src/locales/en/common.json`, `src/locales/pt/common.json`, `src/locales/es/common.json`, `src/test/language.test.tsx`, `src/lib/i18n.test.ts`
Problem: The language model is inconsistent. `src/types/language.ts` and `src/hooks/useLanguage.tsx` allow `fr`, but `src/lib/i18n.ts` only configures `en`, `pt`, and `es`. `LanguageProvider` also accepts `defaultLanguage` but does not use it. Dates in the UI use `toLocaleDateString()` without reference to the active app language.
Implementation:
- Choose a single supported-language set and use it everywhere.
- Either implement French resources end to end or remove French from the available language model.
- Use or remove `defaultLanguage` so the provider API matches behavior.
- Format project dates using the active app language instead of the browser default alone.
- Localize any remaining shell copy surfaced by T3, T4, and T5.
Acceptance Criteria:
- There is one authoritative language list used by types, provider logic, and i18n configuration.
- The provider API has no unused language configuration surface.
- Project dates render according to the selected application language.
- Language-related tests reflect the final supported-language contract.
Validation:
- `npm run test -- src/test/language.test.tsx`
- `npm run test -- src/lib/i18n.test.ts`
- `npm run lint`
- `npm run typecheck`
Dependencies:
- T3, T4, and T5 for final copy alignment and UI text coverage.

## T7. Reduce Scroll-Driven Rendering Work In The Header And Hero Background

Status: `[ ]`
Priority: P1
Files: `src/components/Header.tsx`, `src/components/Hero.tsx`, `src/components/TopographicBackground.tsx`
Problem: `src/components/Header.tsx` reads layout and sets React state on every scroll event to update `isScrolled` and `logoOpacity`. `src/components/TopographicBackground.tsx` subscribes to global scroll motion and runs several animated SVG paths regardless of motion preference. This is acceptable on fast devices, but it is the clearest rendering hotspot in the current frontend.
Implementation:
- Reduce or coalesce scroll-driven React state updates in the header.
- Avoid recalculating logo opacity through layout reads more often than necessary.
- Respect reduced-motion preferences in the topographic background, including initial path animations.
- Keep the visual design, but make the implementation cheaper on low-power devices.
Acceptance Criteria:
- Header scroll behavior does not trigger avoidable state updates on every scroll tick.
- Reduced-motion users get a materially simpler animated background behavior.
- No visible regression in header branding or hero presentation on desktop or mobile.
Validation:
- `npm run lint`
- `npm run typecheck`
- `npm run test:e2e -- e2e/responsive.spec.ts --project=chromium --grep "header|hero"`
Dependencies:
- T1 for resilient responsive assertions.
Blockers:
- The Playwright validation step has the same preview-server environment limitation noted in T1.

## T8. Audit TypeScript And Test/Build Configuration Strictness

Status: `[!]`
Priority: P2
Files: `tsconfig.json`, `tsconfig.app.json`, `eslint.config.js`, `playwright.config.ts`
Problem: The compiler is currently permissive, with `strict`, `noImplicitAny`, and `strictNullChecks` disabled. That matches the original audit theme, but changing these settings affects build and test tooling and is explicitly approval-gated by repository instructions.
Implementation:
- Inventory the smallest strictness changes that provide signal without flooding the repo with unrelated errors.
- Propose any Playwright config changes needed to make local verification more reliable.
- Split config changes from application changes so approval can be granted or rejected cleanly.
Acceptance Criteria:
- There is a documented proposal for strictness changes with expected fallout.
- Any approved config change is implemented in isolation with its own validation notes.
- No stealth build-tool or test-tooling changes are mixed into unrelated tasks.
Validation:
- `npm run lint`
- `npm run typecheck`
- `npm run test`
Dependencies:
- User approval before implementation.

## Recommended Execution Order

1. T0
2. T2
3. T1
4. T3
5. T4
6. T5
7. T6
8. T7
9. T8 after approval
