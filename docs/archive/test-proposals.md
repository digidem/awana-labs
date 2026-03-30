# Test Proposals for High-Risk Areas

## Overview

This document identifies high-risk areas in the codebase that lack adequate test coverage and proposes specific test files with locations.

## Current Test Coverage Assessment

**Existing Tests:**

- `e2e/basic.spec.ts` - Basic page load, routing, asset loading, accessibility, performance
- `e2e/projects.spec.ts` - Projects display, data integrity, links
- `e2e/verify-projects.spec.ts` - Specific project verification
- `src/test/example.test.ts` - Placeholder test (minimal value)

**Coverage Gaps:**

- No unit tests for components
- No unit tests for hooks
- No unit tests for utility functions
- No integration tests for data fetching
- No error boundary tests
- No accessibility tests for modal interactions
- No tests for search/filter functionality

---

## High-Risk Areas and Proposed Tests

### 1. Data Fetching and State Management (HIGH RISK)

**Risk:** The `Index.tsx` page fetches `projects.json` without proper error handling or loading state testing.

#### Proposed Test: `src/pages/Index.test.tsx`

```typescript
// Test cases to implement:
// - Loading state displays correctly
// - Projects fetch successfully and render
// - Error state when projects.json fails to load
// - Empty state when projects array is empty
// - Re-fetching on remount (if applicable)
```

**Location:** `src/pages/Index.test.tsx`

**Why High Risk:**

- Single point of failure for all data
- No error recovery mechanism
- Silent failure (only console.error)

---

### 2. Project Modal Component (HIGH RISK)

**Risk:** `ProjectModal.tsx` has complex keyboard navigation, image carousel, and accessibility requirements. Bugs here directly impact user experience.

#### Proposed Test: `src/components/ProjectModal.test.tsx`

```typescript
// Test cases to implement:
// - Modal opens/closes with correct project
// - Keyboard navigation (Escape, Arrow keys)
// - Image carousel navigation (next/previous buttons)
// - Image carousel wraps around correctly
// - Dot indicators update correctly
// - Body scroll is locked when modal opens
// - Body scroll is restored when modal closes
// - Event listeners are cleaned up on unmount
// - Reduced motion preference is respected
// - All external links have correct attributes
// - ARIA attributes are correct (role, aria-modal, aria-label)
```

**Location:** `src/components/ProjectModal.test.tsx`

**Why High Risk:**

- Complex state management (image index)
- Global side effects (body scroll, event listeners)
- Accessibility critical (keyboard navigation)
- Memory leak potential (event listeners)

---

### 3. Projects Gallery Search and Filter (HIGH RISK)

**Risk:** `ProjectsGallery.tsx` contains search and filter logic that is not tested. Incorrect filtering could hide projects from users.

#### Proposed Test: `src/components/ProjectsGallery.test.tsx`

```typescript
// Test cases to implement:
// - All projects display when no filters applied
// - Search filters by title (case-insensitive)
// - Search filters by description (case-insensitive)
// - Search filters by tags (case-insensitive)
// - Status filter (all, active, paused, archived)
// - Combined search + status filter works correctly
// - Empty results state displays when no matches
// - Clear filters button resets all filters
// - Filter buttons show correct active state
// - useMemo optimization is working (function reference checks)
```

**Location:** `src/components/ProjectsGallery.test.tsx`

**Why High Risk:**

- Core user-facing functionality
- Complex filtering logic
- No validation that filters work correctly

---

### 4. useMobile Hook (MEDIUM-HIGH RISK)

**Risk:** `use-mobile.tsx` uses `window.matchMedia` and has potential memory leak if event listeners aren't cleaned up.

#### Proposed Test: `src/hooks/use-mobile.test.tsx`

```typescript
// Test cases to implement:
// - Returns true for mobile viewport (< 768px)
// - Returns false for desktop viewport (>= 768px)
// - Updates correctly on viewport resize
// - Cleans up event listener on unmount
// - Handles multiple components using the hook
// - Handles rapid resize events
```

**Location:** `src/hooks/use-mobile.test.tsx`

**Why Medium-High Risk:**

- Memory leak potential
- Responsive breakpoints are business-critical
- No test for cleanup behavior

---

### 5. ProjectCard Component (MEDIUM RISK)

**Risk:** `ProjectCard.tsx` has accessibility features and animation logic that could break.

#### Proposed Test: `src/components/ProjectCard.test.tsx`

```typescript
// Test cases to implement:
// - Renders project data correctly
// - Keyboard activation (Enter key) triggers onClick
// - Hover animation only applies when reduced motion is off
// - Status badge has correct styling for each state
// - Tags are truncated correctly (+N indicator)
// - ARIA attributes are correct
// - tabIndex is present for keyboard navigation
```

**Location:** `src/components/ProjectCard.test.tsx`

**Why Medium Risk:**

- Accessibility features need verification
- Animation behavior depends on preferences

---

### 6. Utility Functions (MEDIUM RISK)

**Risk:** `lib/utils.ts` has a `cn()` function used throughout the app. Bugs here affect all styling.

#### Proposed Test: `src/lib/utils.test.ts`

```typescript
// Test cases to implement:
// - Merges class names correctly with clsx
// - Tailwind merge resolves conflicts correctly
// - Handles undefined/null inputs
// - Handles empty inputs
// - Handles duplicate classes with different values
```

**Location:** `src/lib/utils.test.ts`

**Why Medium Risk:**

- Used across entire application
- Tailwind conflicts could cause visual bugs

---

### 7. NotFound Page (LOW-MEDIUM RISK)

**Risk:** `NotFound.tsx` logs errors but has no tests to verify it renders correctly.

#### Proposed Test: `src/pages/NotFound.test.tsx`

```typescript
// Test cases to implement:
// - Renders 404 heading
// - Renders error message
// - Home link navigates correctly
// - Logs error to console with correct location
```

**Location:** `src/pages/NotFound.test.tsx`

**Why Low-Medium Risk:**

- Simple component
- Important for error handling flow

---

### 8. Hero Component (LOW RISK)

**Risk:** `Hero.tsx` has scroll behavior and animations.

#### Proposed Test: `src/components/Hero.test.tsx`

```typescript
// Test cases to implement:
// - Renders correctly
// - Scroll button scrolls to projects section
// - Reduced motion preference disables animation
```

**Location:** `src/components/Hero.test.tsx`

**Why Low Risk:**

- Simple display component
- Important for navigation

---

### 9. E2E: Error Scenarios (HIGH RISK)

**Risk:** No E2E tests for error scenarios (network failures, bad data).

#### Proposed Test: `e2e/error-scenarios.spec.ts`

```typescript
// Test cases to implement:
// - Page displays gracefully when projects.json fails to load
// - Page displays gracefully when projects.json has malformed JSON
// - Page displays gracefully when projects.json is empty
// - Page displays gracefully when project images fail to load
// - Page displays gracefully when external links are broken
```

**Location:** `e2e/error-scenarios.spec.ts`

**Why High Risk:**

- Production errors will occur
- No graceful degradation tested

---

### 10. E2E: Accessibility (MEDIUM-HIGH RISK)

**Risk:** No automated accessibility tests beyond basic meta tags.

#### Proposed Test: `e2e/accessibility.spec.ts`

```typescript
// Test cases to implement:
// - All interactive elements are keyboard accessible
// - Modal can be opened/closed with keyboard
// - Focus is trapped in modal when open
// - Focus returns to triggering element after modal closes
// - All images have alt text
// - Color contrast meets WCAG AA standards
// - Form inputs have associated labels
```

**Location:** `e2e/accessibility.spec.ts`

**Why Medium-High Risk:**

- Accessibility is critical for inclusion
- Legal compliance requirements

---

### 11. E2E: Search and Filter (MEDIUM RISK)

**Risk:** Search and filter functionality is not tested end-to-end.

#### Proposed Test: `e2e/search-filter.spec.ts`

```typescript
// Test cases to implement:
// - Search input filters projects in real-time
// - Status filter buttons work correctly
// - Combined search + filter works correctly
// - Clear filters button resets filters
// - Empty state shows when no results
```

**Location:** `e2e/search-filter.spec.ts`

**Why Medium Risk:**

- Core user interaction
- Not covered by existing E2E tests

---

### 12. Integration: Data Pipeline (MEDIUM RISK)

**Risk:** No integration tests for the data flow from projects.json through types to components.

#### Proposed Test: `src/test/data-pipeline.test.ts`

```typescript
// Test cases to implement:
// - projects.json matches Project type schema
// - All required fields are present in each project
// - Timestamps are valid ISO dates
// - URLs are valid and well-formed
// - Status enum values are valid
// - Usage enum values are valid
```

**Location:** `src/test/data-pipeline.test.ts`

**Why Medium Risk:**

- Type safety is only compile-time
- Runtime validation is missing

---

## Priority Order

Implement tests in this order:

1. **HIGH PRIORITY** (Critical functionality, high bug risk):
   - `src/components/ProjectsGallery.test.tsx` - Search/filter logic
   - `src/components/ProjectModal.test.tsx` - Complex interactions
   - `e2e/error-scenarios.spec.ts` - Error handling

2. **MEDIUM-HIGH PRIORITY** (Important features):
   - `src/pages/Index.test.tsx` - Data fetching
   - `src/hooks/use-mobile.test.tsx` - Hook cleanup
   - `e2e/accessibility.spec.ts` - Accessibility

3. **MEDIUM PRIORITY** (Good coverage):
   - `src/components/ProjectCard.test.tsx`
   - `src/lib/utils.test.ts`
   - `e2e/search-filter.spec.ts`

4. **LOW-MEDIUM PRIORITY** (Nice to have):
   - `src/pages/NotFound.test.tsx`
   - `src/components/Hero.test.tsx`
   - `src/test/data-pipeline.test.ts`

---

## Test Infrastructure Notes

Before implementing, ensure:

1. **Vitest setup** (`vitest.config.ts`) is configured for:
   - React Testing Library
   - jsdom environment
   - Coverage reporting

2. **Test utilities** may be needed in `src/test/`:
   - Mock data generators
   - Custom render functions with providers
   - Test helpers for common operations

3. **Mock setup** for:
   - `window.matchMedia` (for use-mobile hook)
   - `framer-motion` (for animation tests)
   - External data fetching

---

## Estimated Test Coverage Impact

Implementing all proposed tests would increase coverage from approximately **5-10%** to **70-85%**, with critical paths reaching **90%+** coverage.
