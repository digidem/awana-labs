# Hooks & State Management Patterns Evaluation

## Executive Summary

This report evaluates the hooks and state management patterns used in the Awana Labs Showcase codebase. Several inconsistencies have been identified across duplicate implementations, import patterns, and architectural choices.

---

## 1. Duplicate Toast Hook Implementation

### Severity: HIGH

### Location: Two duplicate files

#### File: `src/hooks/use-toast.ts`

- **Lines**: Full file (187 lines)
- **Issue**: Complete toast state management implementation with reducer pattern, custom dispatch system, and memory state management.

#### File: `src/components/ui/use-toast.ts`

- **Lines**: Full file (4 lines)
- **Issue**: This is a trivial re-export that simply imports from the hooks version.

```typescript
// src/components/ui/use-toast.ts (lines 1-4)
import { useToast, toast } from "@/hooks/use-toast";

export { useToast, toast };
```

**Inconsistency**: Having a `use-toast.ts` file in `src/components/ui/` is misleading and unnecessary. The shadcn/ui convention places component-related utilities in `src/components/ui/`, but this is a state management hook that should only exist in `src/hooks/`.

**Impact**:

- Confusing for developers looking for toast functionality
- Unnecessary indirection layer
- Violates single source of truth principle

**Recommendation**: Delete `src/components/ui/use-toast.ts` and update all imports to use `@/hooks/use-toast` directly.

---

## 2. Inconsistent React Import Styles

### Severity: LOW

### Locations: Multiple files

Two different import patterns are used for React hooks across the codebase:

#### Pattern A: Named imports (Preferred, used in most app code)

```typescript
// src/pages/Index.tsx:1
import { useState, useEffect } from "react";

// src/components/ProjectsGallery.tsx:1
import { useState, useMemo } from "react";

// src/components/ProjectModal.tsx:1
import { useEffect, useCallback, useState } from "react";
```

#### Pattern B: Namespace import (Used in hooks and UI components)

```typescript
// src/hooks/use-toast.ts:1
import * as React from "react";

// src/hooks/use-mobile.tsx:1
import * as React from "react";

// src/components/ui/toast.tsx:1
import * as React from "react";
```

**Inconsistency**: The codebase uses both `import * as React` and named imports inconsistently. Modern React codebases typically prefer named imports for hooks (`import { useState } from "react"`) since React 17+ doesn't require importing the React object for JSX.

**Impact**:

- Minor inconsistency in code style
- Namespace imports (`* as React`) produce slightly larger bundle sizes
- Mixed patterns can confuse developers about which style to use

**Files affected**:

- `src/hooks/use-toast.ts` (line 1)
- `src/hooks/use-mobile.tsx` (line 1)
- `src/components/ui/toast.tsx` (line 1)
- `src/components/ui/sidebar.tsx` (line 26)
- `src/components/ui/carousel.tsx` (line 24)
- `src/components/ui/toggle-group.tsx` (line 6)
- `src/components/ui/chart.tsx` (line 18)
- `src/components/ui/form.tsx` (line 16)
- `src/components/ui/input-otp.tsx` (line 24)
- Multiple other UI components

**Recommendation**: Standardize on named imports for hooks (`import { useState, useEffect } from "react"`) across all files. Keep namespace imports only where React types are needed extensively.

---

## 3. Inconsistent Quotation Marks

### Severity: LOW

### Locations: Multiple files

The codebase mixes single and double quotation marks for imports and strings.

#### Single quotes:

```typescript
// src/components/ProjectModal.tsx:1
import { useEffect, useCallback, useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Github,
  BookOpen,
} from "lucide-react";
```

#### Double quotes:

```typescript
// src/pages/Index.tsx:1
import { useState, useEffect } from "react";
import Hero from "@/components/Hero";
```

**Inconsistency**: The project doesn't enforce a consistent quote style for imports and strings.

**Recommendation**: Configure ESLint/Prettier to enforce consistent quote style (preferably double quotes as per the existing majority pattern in app code).

---

## 4. State Management Architecture Patterns

### Current State Management Approaches:

| Pattern                    | Location                                   | Purpose                                   |
| -------------------------- | ------------------------------------------ | ----------------------------------------- |
| **Local useState**         | `src/pages/Index.tsx:8-9`                  | Projects data, loading state              |
| **Local useState**         | `src/components/ProjectsGallery.tsx:24-26` | Search query, filter, selected project    |
| **Local useState**         | `src/components/ProjectModal.tsx:28`       | Image carousel index                      |
| **Custom Hook**            | `src/hooks/use-mobile.tsx`                 | Mobile breakpoint detection               |
| **Reducer + Global State** | `src/hooks/use-toast.ts`                   | Toast notifications with listener pattern |
| **React Context**          | `src/components/ui/sidebar.tsx:32`         | Sidebar state                             |
| **React Context**          | `src/components/ui/carousel.tsx:29`        | Carousel state                            |
| **React Context**          | `src/components/ui/form.tsx:18`            | Form field context                        |
| **External Library**       | `src/App.tsx:4`                            | TanStack Query (unused)                   |

### Inconsistency: TanStack Query is Unused

**Location**: `src/App.tsx:4`

```typescript
// src/App.tsx:4
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
```

**Issue**: TanStack Query is configured as a provider but **no components actually use it**. All data fetching in `src/pages/Index.tsx` uses native `fetch` with `useState`/`useEffect`.

**Evidence**:

```typescript
// src/pages/Index.tsx:11-27 - Uses native fetch, not useQuery
useEffect(() => {
  const fetchProjects = async () => {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}projects.json`);
      const data: ProjectsData = await response.json();
      setProjects(data.projects);
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setLoading(false);
    }
  };
  fetchProjects();
}, []);
```

**Impact**:

- Unnecessary dependency and bundle size increase
- Missed opportunity for better caching, refetching, and loading states
- Misleading architecture suggests server state management when none exists

**Recommendation**: Either remove TanStack Query or refactor `src/pages/Index.tsx` to use `useQuery` for proper server state management.

---

## 5. Multiple Toast Systems

### Severity: MEDIUM

### Locations: `src/App.tsx:1-2`

```typescript
// src/App.tsx:1-2
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
```

**Issue**: Two different toast systems are mounted in the app:

1. **shadcn/ui Toast** (`toaster.tsx`) - Uses the custom `use-toast.ts` hook
2. **Sonner** (`sonner.tsx`) - A separate toast library

**Inconsistency**: Only one toast system should be used. Having both adds confusion about which to use in components.

**Recommendation**: Choose one toast system and remove the other. If shadcn/ui toast is preferred, remove Sonner and its provider.

---

## 6. Missing Custom Hook Opportunities

### Severity: LOW

### Location: `src/components/ProjectModal.tsx:36-66`

The `ProjectModal` component has a complex keyboard navigation and side effect pattern that could be extracted into a reusable hook:

```typescript
// src/components/ProjectModal.tsx:36-66
const handleKeyDown = useCallback(
  (e: KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === "Escape") {
      onClose();
    }
    // ... keyboard navigation logic
  },
  [isOpen, onClose, project],
);

useEffect(() => {
  document.addEventListener("keydown", handleKeyDown);
  if (isOpen) {
    document.body.style.overflow = "hidden";
  }
  return () => {
    document.removeEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "";
  };
}, [handleKeyDown, isOpen]);
```

**Recommendation**: Extract into `useKeyboardNavigation` or `useModal` hook for reusability.

---

## 7. Inconsistent Constant Definition Locations

### Severity: LOW

### Locations: Multiple files

Constants are defined in different locations across components:

#### Pattern A: Inside component file

```typescript
// src/components/ProjectCard.tsx:12-16
const statusColors = {
  active: "bg-green-500/10 text-green-700 border-green-500/20",
  paused: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  archived: "bg-muted text-muted-foreground border-border",
};
```

#### Pattern B: Inside component file (duplicate!)

```typescript
// src/components/ProjectModal.tsx:14-18 (DUPLICATE)
const statusColors = {
  active: "bg-green-500/10 text-green-700 border-green-500/20",
  paused: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  archived: "bg-muted text-muted-foreground border-border",
};
```

**Inconsistency**: `statusColors` is duplicated across two files. This is a clear DRY (Don't Repeat Yourself) violation.

**Recommendation**: Extract to `src/lib/constants.ts` or `src/styles/status-variants.ts` for single source of truth.

---

## 8. React Router HashRouter Inconsistency

### Severity: LOW

### Location: `src/App.tsx:5`

```typescript
// src/App.tsx:5
import { HashRouter, Routes, Route } from "react-router-dom";
```

**Issue**: Using `HashRouter` instead of `BrowserRouter`. While this may be intentional for static site deployment on GitHub Pages or similar, it should be a documented decision.

**Recommendation**: If HashRouter is required for deployment, document this constraint. Otherwise, use BrowserRouter for cleaner URLs.

---

## Summary of Inconsistencies by Severity

| Severity   | Count | Issues                                                                 |
| ---------- | ----- | ---------------------------------------------------------------------- |
| **HIGH**   | 1     | Duplicate toast hook files                                             |
| **MEDIUM** | 1     | Two toast systems mounted                                              |
| **LOW**    | 5     | Import styles, quotes, constants, unused TanStack Query, router choice |

---

## Recommendations Priority Order

1. **Remove duplicate toast hook** - Delete `src/components/ui/use-toast.ts`
2. **Remove unused toast system** - Choose between shadcn/ui Toast and Sonner
3. **Either use or remove TanStack Query** - Don't leave unused dependencies
4. **Standardize React imports** - Use named imports consistently
5. **Extract duplicated constants** - Create constants file for shared values
6. **Standardize quotation marks** - Configure ESLint/Prettier
7. **Extract reusable hooks** - Create `useModal` for keyboard navigation patterns

---

## File References Summary

| File                              | Issue                                 | Line(s)        |
| --------------------------------- | ------------------------------------- | -------------- |
| `src/hooks/use-toast.ts`          | Duplicate implementation              | Full file      |
| `src/components/ui/use-toast.ts`  | Unnecessary re-export                 | Full file      |
| `src/hooks/use-mobile.tsx`        | Namespace import style                | 1              |
| `src/App.tsx`                     | Two toast systems, unused QueryClient | 1-5, 9, 14-15  |
| `src/pages/Index.tsx`             | Not using TanStack Query              | 11-27          |
| `src/components/ProjectCard.tsx`  | Duplicated statusColors constant      | 12-16          |
| `src/components/ProjectModal.tsx` | Duplicated statusColors constant      | 14-18          |
| `src/components/ProjectModal.tsx` | Extractable hook pattern              | 36-66          |
| `src/components/ui/*.tsx`         | Inconsistent React imports            | Various line 1 |
