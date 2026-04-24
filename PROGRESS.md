# Awana Labs Improvement Plan — Progress Tracker

> Progress tracker for the Awana Labs improvement plan.

**Last updated:** 2026-04-20

## Summary

| Category | Total | Done | Remaining |
|----------|-------|------|-----------|
| Phase 1 — Quick Wins | 8 | 8 | 0 |
| Phase 2 — Dead Code | 2 | 2 | 0 |
| Phase 3 — Bug Fixes | 3 | 3 | 0 |
| Phase 4 — Performance | 10 | 10 | 0 |
| Phase 5 — Tests (Priority 1) | 2 | 2 | 0 |
| Code Quality (3.1-3.2) | 2 | 2 | 0 |
| Bug Fix 2.2 | 1 | 1 | 0 |
| Architecture (4.x) | 3 | 3 | 0 |
| Dark Mode (5.x) | 1 | 1 | 0 |
| DevTools (6.x) | 1 | 1 | 0 |
| Tests Priority 2 (7.2.x) | 5 | 5 | 0 |
| PWA (8.x) | 1 | 1 | 0 |
| **TOTAL** | **39** | **39** | **0** |

---

## Completed (39/39)

### Phase 1 — Quick Wins

- [x] **1.10** `React.memo` on `ProjectCard` — `src/components/ProjectCard.tsx:92`
- [x] **3.6** Remove `.tsx` extension from import — `src/main.tsx:2`
- [x] **3.10** Fix `GithubIcon` namespace import — `src/components/GithubIcon.tsx:1`
- [x] **3.11** Add `VITE_*` type declarations — `src/vite-env.d.ts:3-7`
- [x] **3.7** Fix `components.json` baseColor — `components.json:9`
- [x] **3.8** Remove stale `<lastmod>` from sitemap — `public/sitemap.xml`
- [x] **3.9** Add `<noscript>` fallback styling — `index.html:53-60`
- [x] **3.5** Remove unused `parseProject()` — `src/types/project.schema.ts`

### Phase 2 — Dead Code Removal

- [x] **3.3** Remove dead shadcn/ui components — `dropdown-menu.tsx` (51 lines), `card.tsx` (25 lines)
- [x] **3.4** Remove dead GitHub client methods — `src/lib/github.ts` (292 lines, dead methods removed)

### Phase 3 — Bug Fixes

- [x] **2.1** Fix double cleanup in ProjectModal — `src/components/ProjectModal.tsx:55-72`
- [x] **2.3** Fix `404.html` meta tag inconsistencies — `public/404.html:6,16`
- [x] **2.4** Robust body overflow save/restore — `src/components/ProjectModal.tsx:62-66`

### Phase 4 — Performance

- [x] **1.1** Replace `new Blob()` with `TextEncoder` — `src/lib/api.ts:53,148,203`
- [x] **1.2** Throttle ScrollToTop via shared hook — `src/components/ScrollToTop.tsx:4,12`
- [x] **1.3** Conditional `rollup-plugin-visualizer` — `vite.config.ts:18-20`
- [x] **1.4** Add `@octokit` to `manualChunks` — `vite.config.ts:32`
- [x] **1.5** Add `zod` and `@radix-ui` chunk rules — `vite.config.ts:33-34`
- [x] **1.6** Reduce Hero h1 animation delay (0.5s → 0.1s) — `src/index.css:166`
- [x] **1.7** Lazy-load Footer — `src/pages/Index.tsx:11`
- [x] **1.8** Consolidate scroll listeners into shared hook — `src/hooks/useScrollPosition.ts`
- [x] **1.9** Fix SW `response.blob()` allocation — `public/sw.js:83-84`
- [x] **1.11** Wrap `filterOptions` in `useMemo` — `src/components/ProjectsGallery.tsx:46`

### Other Completed

- [x] **2.2** SSR guard in `useReducedMotion` — `src/components/TopographicBackground.tsx:6`
- [x] **3.1** Deduplicate storage mock — `src/test/setup.ts:19-40`
- [x] **3.2** Use `createMockProject()` in Index tests — `src/pages/Index.test.tsx`

### Test Coverage — Priority 1

- [x] **7.1.1** Add `src/lib/sort-projects.test.ts` — 13 tests covering all sort dimensions
- [x] **7.1.2** Add `src/lib/issue-parser.test.ts` — 58 tests covering all 8 exported functions

### Test Coverage — Priority 2

- [x] **7.2.1** Add `src/lib/status-utils.test.ts` — 10 tests for status colors, translation keys, and helpers
- [x] **7.2.2** Add `src/components/ScrollToTop.test.tsx` — 5 tests for scroll visibility and click behavior
- [x] **7.2.3** Add `src/components/Header.test.tsx` — 7 tests for scroll state, logo opacity, and navigation
- [x] **7.2.4** Add `src/components/ErrorBoundary.test.tsx` — 7 tests for error catching, retry, and i18n
- [x] **7.2.5** Add `src/lib/utils.test.ts` — 10 tests for formatRelativeTime across all time ranges

### Architectural Improvements

- [x] **4.1** Consolidate language detection — localStorage read on init for first-render correctness, `awana-labs-language` is single source of truth for writes
- [x] **4.2** Evaluate `@octokit/rest` — evaluated; already isolated in its own chunk (102 KB gzip: 19.85 KB), kept as-is
- [x] **4.3** Functional ErrorBoundary wrapper — extracted `ErrorDisplay` with `useTranslation()`, removed manual `i18n.on/off`

### Dark Mode

- [x] **5.2** Dark mode CSS variables + system preference detection — added `.dark` class with inverted HSL values, `prefers-color-scheme` media query detection in `index.html`, `useTheme` hook for runtime toggling, replaced hardcoded colors with CSS variable tokens, updated meta tag and Tailwind config

### React Query DevTools

- [x] **6.1** Installed `@tanstack/react-query-devtools` as devDependency, added conditional render in `src/App.tsx`

### PWA and Metadata

- [x] **8.1** Generated 192x192 and 512x512 PNG icons from SVG, added to `public/manifest.json`

---

## Remaining (0/39)

All tasks from the improvement plan have been completed.

---

## Verification Status

> Verification items are tracked separately from the 39 implementation tasks above.

- [x] `npm run lint` — 0 errors
- [x] `npm run typecheck` — 0 errors
- [x] `npm run test` — 278 tests passing
- [x] `npm run build` — production build succeeds
- [ ] E2E tests — pending CI verification
- [ ] Lighthouse audit — pending manual verification
