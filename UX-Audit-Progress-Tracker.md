# Awana Labs UX/UI Audit & Progress Tracker

Remaining issues from the UX/Design and Quality Assessment audit of the Awana Labs web application.

---

## 1. User Experience (UX)

- [x] **HIGH**: Add skip-navigation link for keyboard accessibility.
  - *Location*: Top of page — `src/pages/Index.tsx`
  - *Description*: No `<a href="#projects">Skip to content</a>` link exists. Keyboard-only users must tab through the entire header on every page visit. WCAG 2.1 Level A failure (criterion 2.4.1 "Bypass Blocks").
- [x] **MEDIUM**: Add scroll-to-top mechanism.
  - *Location*: Global — floating button (`src/components/ScrollToTop.tsx`)
  - *Description*: After scrolling through 16+ projects, there is no way to return to top besides native browser scroll.

## 2. Accessibility (WCAG Compliance)

- [x] **HIGH**: Implement focus trap in ProjectModal.
  - *Location*: `src/components/ProjectModal.tsx` — modal container div
  - *Description*: ARIA attributes (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`) are in place. Focus wrapping is not — users can Tab out of the modal to background elements. Need Tab/Shift+Tab wrapping within focusable elements in the existing `handleKeyDown` callback.
- [x] **MEDIUM**: Add `aria-current` to carousel dot indicators.
  - *Location*: `src/components/ProjectModal.tsx` — dot buttons
  - *Description*: Dot indicators have `aria-label` but don't communicate which is active. Add `aria-current={index === currentImageIndex ? "true" : undefined}`.
- [x] **MEDIUM**: Status filter pills — added non-color active indicator.
  - *Location*: `src/components/ProjectsGallery.tsx` — filter buttons
  - *Description*: Active pill now has `ring-2 ring-primary-foreground/30` outline in addition to color change, making the active state distinguishable for color-deficient users.

## 3. Performance & Technical Quality

- [ ] **LOW**: Replace remaining `framer-motion` usage with CSS animations.
  - *Location*: `src/components/ProjectModal.tsx`, `src/components/ProjectCard.tsx`, `src/components/ProjectsGallery.tsx`, `src/components/Footer.tsx`
  - *Description*: ~30KB gzipped library. `Header.tsx` and `Hero.tsx` already migrated to CSS keyframes. Four components remain.
- [ ] **LOW**: `App.css` contains unused Vite boilerplate styles.
  - *Location*: `src/App.css`
  - *Description*: `.logo`, `.card`, `.read-the-docs`, `@keyframes logo-spin` are leftover from the Vite React template and unused.

## 4. Functional Issues

- [ ] **MEDIUM**: Error state retry button uses raw `<button>` instead of shadcn `<Button>`.
  - *Location*: `src/pages/Index.tsx` — `isError` branch
  - *Description*: Inline button with manual Tailwind classes instead of the design system's `<Button>` component.
- [ ] **LOW**: Hero "Explore Projects" button has unnecessary `cursor-pointer` class.
  - *Location*: `src/components/Hero.tsx`
  - *Description**: Inconsistent with other buttons on the page.

---

## Actionable Prompts

- [x] **PROMPT 1: Add skip-navigation link (HIGH)**
  - Add `<a href="#projects" className="sr-only focus:not-sr-only ...">{t("accessibility.skipToContent")}</a>` as first element in `Index.tsx`. Add `tabIndex={-1}` to the projects section in `ProjectsGallery.tsx`. Add i18n key to all locales.

- [x] **PROMPT 2: Implement focus trap in ProjectModal (HIGH)**
  - In `handleKeyDown`, query focusable elements (`'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'`). On Tab from last element, wrap to first. On Shift+Tab from first, wrap to last.

- [x] **PROMPT 3: Add aria-current to carousel dots (MEDIUM)**
  - Add `aria-current={index === currentImageIndex ? "true" : undefined}` to each dot button in `ProjectModal.tsx`.

- [ ] **PROMPT 4: Use shadcn Button in error state (MEDIUM)**
  - Replace raw `<button>` with `<Button>` from `@/components/ui/button` in `Index.tsx` error branch.

- [ ] **PROMPT 5: Clean up App.css (LOW)**
  - Remove `.logo`, `.card`, `.read-the-docs`, `@keyframes logo-spin`. Check if `#root` styles are redundant with Tailwind. Consider removing `App.css` import entirely.
