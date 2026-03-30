# Styling Standardization Recommendations

## Executive Summary

This document outlines recommended standardizations for the Awana Labs Showcase codebase based on comprehensive analysis of current styling patterns.

**Overall Assessment: 7.5/10** - Solid foundation with room for consistency improvements.

---

## 1. Color System Standardization

### Current State

- Well-defined CSS custom properties in `src/index.css`
- Inconsistent usage of semantic vs hardcoded colors across components

### Issue: Duplicate Status Color Definitions

**Files Affected:**

- `src/components/ProjectCard.tsx:12-16`
- `src/components/ProjectModal.tsx:14-18`

**Current Anti-Pattern:**

```tsx
// Duplicated in multiple files
const statusColors = {
  active: "bg-green-500/10 text-green-700 border-green-500/20",
  paused: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  archived: "bg-muted text-muted-foreground border-border",
};
```

**Recommended Solution:**

1. **Add semantic status tokens to `src/index.css`:**

```css
:root {
  /* ... existing colors ... */

  /* Status colors */
  --status-active-bg: 142 76% 96%;
  --status-active-text: 142 71% 45%;
  --status-active-border: 142 71% 45% / 0.2;

  --status-paused-bg: 38 92% 96%;
  --status-paused-text: 38 92% 40%;
  --status-paused-border: 38 92% 40% / 0.2;

  --status-archived-bg: var(--muted);
  --status-archived-text: var(--muted-foreground);
  --status-archived-border: var(--border);
}

.dark {
  /* ... existing dark mode colors ... */

  --status-active-bg: 142 76% 15%;
  --status-active-text: 142 71% 75%;

  --status-paused-bg: 38 92% 15%;
  --status-paused-text: 38 92% 75%;
}
```

2. **Add Tailwind config extensions in `tailwind.config.ts`:**

```ts
export default {
  theme: {
    extend: {
      colors: {
        status: {
          active: {
            bg: "hsl(var(--status-active-bg))",
            text: "hsl(var(--status-active-text))",
            border: "hsl(var(--status-active-border))",
          },
          paused: {
            bg: "hsl(var(--status-paused-bg))",
            text: "hsl(var(--status-paused-text))",
            border: "hsl(var(--status-paused-border))",
          },
          archived: {
            bg: "hsl(var(--status-archived-bg))",
            text: "hsl(var(--status-archived-text))",
            border: "hsl(var(--status-archived-border))",
          },
        },
      },
    },
  },
};
```

3. **Create shared utility in `src/lib/status-utils.ts`:**

```ts
export const getStatusClasses = (status: "active" | "paused" | "archived") => {
  const classes = {
    active:
      "bg-status-active-bg text-status-active-text border-status-active-border",
    paused:
      "bg-status-paused-bg text-status-paused-text border-status-paused-border",
    archived:
      "bg-status-archived-bg text-status-archived-text border-status-archived-border",
  };
  return classes[status];
};
```

4. **Updated component usage:**

```tsx
import { getStatusClasses } from "@/lib/status-utils";

<Badge className={getStatusClasses(project.status)}>{project.status}</Badge>;
```

---

## 2. Spacing Standardization

### Current State

- Inconsistent spacing values across components
- Mixed use of Tailwind's scale and arbitrary values

### Issue: Inconsistent Section Spacing

**Files Affected:**

- `src/components/ProjectsGallery.tsx:60` - Uses `py-20 px-6`
- `src/components/ProjectCard.tsx:62` - Uses `pb-3`
- Various components with inconsistent padding

**Recommended Solution:**

Define semantic spacing scale in `tailwind.config.ts`:

```ts
export default {
  theme: {
    extend: {
      spacing: {
        section: "5rem", // 80px - Main sections
        subsection: "3rem", // 48px - Subsections
        card: "1.5rem", // 24px - Card padding
        element: "1rem", // 16px - Between elements
        tight: "0.75rem", // 12px - Tight spacing
        compact: "0.5rem", // 8px - Compact spacing
      },
    },
  },
};
```

**Usage Examples:**

```tsx
// Section containers
<section className="py-section px-element">

// Card components
<Card className="p-card">

// Header/Footer within cards
<CardHeader className="pb-compact">
<CardFooter className="pt-tight">

// Element grouping
<div className="space-y-element">
```

---

## 3. Opacity Pattern Standardization

### Current State

- Mixed use of `bg-primary/10`, `opacity-80`, and `text-primary/70`

### Recommended Standard

Use only Tailwind's opacity modifier syntax with consistent levels:

| Opacity Level | Use Case                        | Example                                |
| ------------- | ------------------------------- | -------------------------------------- |
| `/5`          | Very subtle backgrounds         | `bg-primary/5`                         |
| `/10`         | Light backgrounds, hover states | `bg-primary/10`, `hover:bg-primary/10` |
| `/20`         | Borders, divider lines          | `border-primary/20`                    |
| `/50`         | Medium backgrounds              | `bg-primary/50`                        |
| `/70`         | Text with reduced opacity       | `text-muted-foreground/70`             |
| `/80`         | Strong backgrounds, backdrop    | `bg-card/80`                           |
| `/90`         | Near-solid backgrounds          | `hover:bg-primary/90`                  |

**Anti-pattern to avoid:**

```tsx
// DON'T - Direct opacity class
<div className="bg-primary opacity-80">

// DON'T - Arbitrary opacity values
<div className="bg-primary/[0.82]">
```

**Correct pattern:**

```tsx
// DO - Use Tailwind opacity modifiers
<div className="bg-primary/80">
```

---

## 4. Transition & Animation Standardization

### Current State

- Generally good implementation with proper keyframes
- Some inconsistent transition values

### Recommended Standard

Define consistent transition utilities:

```ts
// In src/lib/transitions.ts
export const transitions = {
  // Interaction transitions
  fast: "transition-all duration-150 ease-out",
  default: "transition-all duration-300 ease-out",
  slow: "transition-all duration-500 ease-out",

  // Specific property transitions
  colors: "transition-colors duration-300 ease-out",
  transform: "transition-transform duration-300 ease-out",
  shadow: "transition-shadow duration-300 ease-out",

  // Hover interactions
  hover: "transition-all duration-300 hover:duration-150",
} as const;
```

**Usage examples:**

```tsx
// Interactive cards
<Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">

// Buttons
<Button className="transition-colors duration-200">

// Form inputs
<Input className="transition-all duration-200 focus:ring-2">
```

---

## 5. Border & Shadow Standardization

### Current State

- Inconsistent border usage (`border-border/50` vs `border-border`)
- Mixed shadow patterns

### Recommended Standard

**Border Usage:**

```tsx
// No border (default)
<Card className="border-0">

// Subtle border (cards, panels)
<Card className="border border-border/50">

// Full border (dividers, separators)
<hr className="border-border">

// Focus/active states
<Input className="focus:ring-2 focus:ring-primary/20">
```

**Shadow Scale:**

```ts
// In tailwind.config.ts
export default {
  theme: {
    extend: {
      boxShadow: {
        subtle: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        default:
          "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        medium:
          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        large:
          "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        glow: "0 0 20px rgb(var(--primary) / 0.3)",
      },
    },
  },
};
```

---

## 6. Component Structure Patterns

### Recommended Component Style Organization

```tsx
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

// 1. Define component-specific variants (if applicable)
const cardVariants = cva("base-card-classes", {
  variants: {
    variant: {
      default: "variant-classes",
      compact: "variant-classes",
    },
  },
});

// 2. Component props interface
interface ProjectCardProps {
  project: Project;
  variant?: "default" | "compact";
  className?: string;
}

// 3. Component function
export function ProjectCard({
  project,
  variant = "default",
  className,
}: ProjectCardProps) {
  // 4. Internal class computation (use cn() for merging)
  const cardClasses = cn(
    cardVariants({ variant }),
    "hover:shadow-lg transition-all duration-300",
    className,
  );

  // 5. Render with consistent structure
  return (
    <Card className={cardClasses}>
      <CardHeader className="pb-compact">{/* Content */}</CardHeader>
    </Card>
  );
}
```

---

## 7. Responsive Design Patterns

### Recommended Standard

Use mobile-first responsive design with consistent breakpoints:

```tsx
// Default (mobile-first)
<div className="p-element">

// Tablet and up
<div className="p-element md:p-card">

// Desktop and up
<div className="p-element md:p-card lg:p-subsection">

// Specific breakpoint patterns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// Hide/show at breakpoints
<div className="hidden md:block">
<div className="block lg:hidden">
```

---

## 8. Dark Mode Patterns

### Current State

- Well-implemented class-based dark mode
- Consistent use of `dark:` prefix

### Recommended Pattern

```tsx
// Always define both light and dark variants
<Card className="bg-card dark:bg-card/95 text-foreground">

// For overlays/backgrounds
<div className="bg-background/80 dark:bg-background/90 backdrop-blur-sm">

// For borders
<div className="border-border dark:border-border/50">

// For text
<p className="text-foreground dark:text-foreground/90">
```

---

## 9. Cleanup Recommendations

### Files to Remove/Update

1. **`src/App.css`** - Appears to be leftover from Vite template
   - Contains unused React-specific styles
   - Has animations that may duplicate Tailwind keyframes
   - **Recommendation:** Review and remove unused styles

2. **Remove duplicate color definitions:**
   - Consolidate `statusColors` from `ProjectCard.tsx` and `ProjectModal.tsx` into shared utility

---

## 10. Priority Implementation Order

### Phase 1: High Priority (Foundation)

1. ✅ Create shared status color tokens in `src/index.css`
2. ✅ Add status colors to `tailwind.config.ts`
3. ✅ Create `src/lib/status-utils.ts` utility
4. ✅ Update components to use shared status utilities

### Phase 2: Medium Priority (Consistency)

5. ✅ Define semantic spacing scale in `tailwind.config.ts`
6. ✅ Standardize transition utilities in `src/lib/transitions.ts`
7. ✅ Update components to use consistent spacing

### Phase 3: Low Priority (Polish)

8. Review and clean up `src/App.css`
9. Create `src/components/StyleGuide.tsx` for documentation
10. Add storybook-style examples for component variants

---

## Quick Reference Card

### Color Tokens

```tsx
// Semantic colors (preferred)
(bg - primary, text - primary, border - primary);
(bg - card, text - card - foreground);
(bg - muted, text - muted - foreground);

// Status colors (use utility)
getStatusClasses("active");
```

### Spacing

```tsx
// Semantic spacing
(p - section, py - section); // Main sections
(p - card, p - subsection); // Cards, subsections
(space - y - element, gap - element); // Between elements
```

### Transitions

```tsx
transition-all duration-300  // Default
transition-colors duration-200 // Colors only
```

### Opacity

```tsx
bg - primary / 10; // Light backgrounds
border - border / 20; // Borders
text - muted - foreground / 70; // Text
```

---

## Appendix: Complete Example

### Before (Current Anti-Pattern)

```tsx
// src/components/ProjectCard.tsx
const statusColors = {
  active: "bg-green-500/10 text-green-700 border-green-500/20",
  paused: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  archived: "bg-muted text-muted-foreground border-border",
};

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Card className="h-full cursor-pointer transition-shadow duration-300 hover:shadow-xl border-border/50 bg-card/80 backdrop-blur-sm group">
      <CardHeader className="pb-3">
        <Badge className={statusColors[project.status]}>{project.status}</Badge>
      </CardHeader>
    </Card>
  );
}
```

### After (Standardized)

```tsx
// src/components/ProjectCard.tsx
import { cn } from "@/lib/utils";
import { getStatusClasses } from "@/lib/status-utils";

interface ProjectCardProps {
  project: Project;
  className?: string;
}

export function ProjectCard({ project, className }: ProjectCardProps) {
  return (
    <Card
      className={cn(
        "h-full cursor-pointer",
        "transition-all duration-300",
        "hover:shadow-lg hover:-translate-y-0.5",
        "border border-border/50 bg-card/80 backdrop-blur-sm",
        "group",
      )}
    >
      <CardHeader className="pb-compact">
        <Badge className={getStatusClasses(project.status)}>
          {project.status}
        </Badge>
      </CardHeader>
    </Card>
  );
}
```

---

**Document Version:** 1.0
**Last Updated:** 2025-02-04
**Analysis Based On:** Commit 551bd18
