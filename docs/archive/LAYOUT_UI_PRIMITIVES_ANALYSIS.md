# Layout/UI Primitives Analysis Report

**Date**: 2025-02-04
**Task**: Identify layout/UI logic to extract into primitives with candidate components
**Stack**: React 18, TypeScript 5, Vite 5, Tailwind CSS 3, shadcn/ui

---

## Executive Summary

This report identifies repeated layout and UI patterns throughout the codebase that can be extracted into reusable primitive components. The analysis covers 16 candidate components spanning motion/animation, layout containers, card components, modal patterns, typography, and interactive elements.

**Key Findings**:

- **16 candidate primitive components** identified
- **High-priority extractions**: SectionContainer, StatusBadge, AnimatedContainer
- **Code duplication**: Status colors, usage labels, and motion variants repeated across 4+ components
- **Accessibility opportunity**: Unified `useReducedMotion` handling and ARIA attributes

---

## 1. Current Component Structure

### Main Components (`src/components/`)

| Component                   | Purpose                     | Key Patterns                              |
| --------------------------- | --------------------------- | ----------------------------------------- |
| `Hero.tsx`                  | Landing hero section        | Framer Motion variants, responsive text   |
| `ProjectsGallery.tsx`       | Project grid with filtering | Grid layout, search, filter pills         |
| `ProjectCard.tsx`           | Individual project display  | Card layout, status badges, hover effects |
| `ProjectModal.tsx`          | Project detail modal        | Backdrop, carousel, image navigation      |
| `Footer.tsx`                | Site footer                 | Flex layout, links                        |
| `NavLink.tsx`               | Navigation links            | Hover states                              |
| `TopographicBackground.tsx` | SVG animated background     | Scroll transforms                         |

### shadcn/ui Primitives (`src/components/ui/`)

Complete set including: accordion, alert, avatar, badge, button, card, dialog, input, label, scroll-area, separator, skeleton, tooltip, etc.

---

## 2. Repeated Patterns Found

### 2.1 Motion/Animation Patterns

**Framer Motion Container Variants** - Repeated in 4 components:

```typescript
// Hero.tsx, ProjectsGallery.tsx, ProjectCard.tsx, ProjectModal.tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};
```

**useReducedMotion Handling** - Repeated in 4 components:

```typescript
const shouldReduceMotion = useReducedMotion();
// Conditional animation props applied
```

**Stagger Delay Patterns**:

- `ProjectCard.tsx`: `index * 0.05`
- `ProjectsGallery.tsx`: `staggerChildren: 0.1`

### 2.2 Card Layout Patterns

**Status Color Mapping** - Duplicated in `ProjectCard.tsx` AND `ProjectModal.tsx`:

```typescript
const statusColors: Record<string, string> = {
  Active: "bg-green-500/20 text-green-700 dark:text-green-400",
  Maintenance: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  Deprecated: "bg-gray-500/20 text-gray-700 dark:text-gray-400",
  Experimental: "bg-purple-500/20 text-purple-700 dark:text-purple-400",
};
```

**Usage Label Mapping** - Duplicated in `ProjectCard.tsx` AND `ProjectModal.tsx`:

```typescript
const usageLabels: Record<string, string> = {
  high: "High Traffic",
  medium: "Medium Traffic",
  low: "Low Traffic",
};
```

**Card Structure Pattern**:

- Header with avatar + title
- Status badge (top-right)
- Description section
- Tags/technologies list
- Footer with metadata (usage, updated date)

### 2.3 Filter/Search Patterns

**Search Input Pattern** (`ProjectsGallery.tsx`):

```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
  <input type="search" placeholder="Search projects..." />
</div>
```

**Filter Pills Pattern** (`ProjectsGallery.tsx`):

```tsx
<button
  className={isActive ? "bg-primary text-primary-foreground" : "bg-muted"}
>
  {filter}
</button>
```

### 2.4 Layout Patterns

**Section Container Pattern** - Repeated 3+ times:

```tsx
<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
```

**Responsive Grid Pattern**:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

**Responsive Flex Direction Pattern**:

```tsx
<div className="flex flex-col sm:flex-row gap-4">
```

**Responsive Text Pattern**:

```tsx
<h1 className="text-5xl md:text-7xl">
```

### 2.5 Modal Patterns

**Backdrop Pattern**:

```tsx
<div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
```

**Modal Container Pattern**:

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
```

**Close Button Pattern**:

```tsx
<button className="absolute top-4 right-4">
  <X />
</button>
```

### 2.6 Background/Visual Patterns

**Logo Placeholder**:

```tsx
<div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
  <span className="text-xl font-semibold text-primary">
    {title.charAt(0).toUpperCase()}
  </span>
</div>
```

### 2.7 Link/Navigation Patterns

**External Link Pattern**:

```tsx
<a href={url} target="_blank" rel="noopener noreferrer">
```

---

## 3. Candidate Primitive Components

### Priority 1: High Impact (Implement First)

#### 1. `SectionContainer.tsx`

**Purpose**: Standardized section wrapper with responsive max-width and padding

**Props**:

```typescript
interface SectionContainerProps {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  className?: string;
}
```

**Implementation**:

```tsx
const sizeMap = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  "2xl": "max-w-7xl",
  full: "max-w-full",
};

export function SectionContainer({
  children,
  size = "xl",
  className,
}: SectionContainerProps) {
  return (
    <section
      className={cn("mx-auto px-4 sm:px-6 lg:px-8", sizeMap[size], className)}
    >
      {children}
    </section>
  );
}
```

**Benefits**:

- Eliminates 3+ instances of repeated max-width classes
- Consistent section spacing across all pages
- Single source for responsive breakpoint adjustments

**Files to Update**: `Hero.tsx`, `ProjectsGallery.tsx`, `Footer.tsx`

---

#### 2. `StatusBadge.tsx`

**Purpose**: Unified status badge with consistent color mapping

**Props**:

```typescript
interface StatusBadgeProps {
  status: string;
  variant?: "default" | "outline";
  className?: string;
}
```

**Implementation**:

```tsx
const statusColors: Record<string, string> = {
  Active:
    "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30",
  Maintenance:
    "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
  Deprecated:
    "bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/30",
  Experimental:
    "bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30",
};

export function StatusBadge({
  status,
  variant = "default",
  className,
}: StatusBadgeProps) {
  const colors = statusColors[status] || statusColors["Deprecated"];

  return (
    <Badge
      variant={variant}
      className={cn(colors, variant === "outline" && "border", className)}
    >
      {status}
    </Badge>
  );
}
```

**Benefits**:

- Eliminates duplicate `statusColors` objects (currently in 2 files)
- Eliminates duplicate `usageLabels` objects
- Single source for status color management
- Consistent status styling across app

**Files to Update**: `ProjectCard.tsx`, `ProjectModal.tsx`

---

#### 3. `AnimatedContainer.tsx`

**Purpose**: Standardized animated container with stagger children and reduced motion support

**Props**:

```typescript
interface AnimatedContainerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
  as?: React.ElementType;
}
```

**Implementation**:

```tsx
export function AnimatedContainer({
  children,
  staggerDelay = 0.1,
  className,
  as: Component = "div",
}: AnimatedContainerProps) {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : staggerDelay,
      },
    },
  };

  return (
    <Component
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={className}
    >
      {children}
    </Component>
  );
}
```

**Benefits**:

- Centralizes motion variants (currently duplicated 4x)
- Unified `useReducedMotion` handling
- Consistent animation timing across app
- Reduces Framer Motion boilerplate

**Files to Update**: `Hero.tsx`, `ProjectsGallery.tsx`, `ProjectCard.tsx`, `ProjectModal.tsx`

---

### Priority 2: Medium Impact

#### 4. `FilterPills.tsx`

**Purpose**: Reusable filter/search controls with responsive layout

**Props**:

```typescript
interface FilterOption {
  value: string;
  label: string;
}

interface FilterPillsProps {
  options: FilterOption[];
  value: string[];
  onChange: (value: string[]) => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  className?: string;
}
```

**Benefits**:

- Reusable across any filterable content
- Consistent filter UX
- Responsive layout (horizontal on desktop, wrapped on mobile)

**Files to Update**: `ProjectsGallery.tsx`

---

#### 5. `ModalContainer.tsx`

**Purpose**: Modal wrapper with backdrop, keyboard handling, and accessibility

**Props**:

```typescript
interface ModalContainerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}
```

**Benefits**:

- Consistent modal behavior (backdrop, keyboard ESC)
- ARIA compliance (focus trapping, proper roles)
- Standardized animations

**Files to Update**: `ProjectModal.tsx`

---

#### 6. `ProjectAvatar.tsx`

**Purpose**: Logo placeholder with first letter fallback

**Props**:

```typescript
interface ProjectAvatarProps {
  title: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}
```

**Benefits**:

- Eliminates repeated avatar pattern
- Consistent sizing options
- Fallback handling for missing logos

**Files to Update**: `ProjectCard.tsx`, `ProjectModal.tsx`

---

### Priority 3: Lower Impact (Nice to Have)

#### 7. `GridLayout.tsx`

**Purpose**: Responsive grid with configurable columns

**Props**:

```typescript
interface GridLayoutProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: string;
  className?: string;
}
```

#### 8. `FadeIn.tsx`

**Purpose**: Simple fade-in animation with viewport detection

#### 9. `StaggeredList.tsx`

**Purpose**: List/grid with stagger animations

#### 10. `ResponsiveLayout.tsx`

**Purpose**: Flex direction changes on mobile (flex-col → sm:flex-row)

#### 11. `ModalHeader.tsx`

**Purpose**: Modal header with close button and avatar slot

#### 12. `ImageCarousel.tsx`

**Purpose**: Image carousel with keyboard navigation and dots

#### 13. `Heading.tsx`

**Purpose**: Responsive heading with consistent sizing

#### 14. `Text.tsx`

**Purpose**: Text component with variants (muted, etc.)

#### 15. `ExternalLink.tsx`

**Purpose**: External link with icon and proper attributes

#### 16. `ResponsiveButton.tsx`

**Purpose**: Button with responsive sizing (different sizes on mobile/desktop)

---

## 4. Implementation Priority

### Phase 1: Foundation (High Impact)

1. ✅ `SectionContainer.tsx` - Most widely used pattern
2. ✅ `StatusBadge.tsx` - Eliminates duplication across components
3. ✅ `AnimatedContainer.tsx` - Centralizes motion logic

**Estimated Impact**:

- Code reduction: ~200 lines
- Duplicates removed: 8 instances
- Files affected: 6

### Phase 2: UX Consistency (Medium Impact)

4. `FilterPills.tsx` - Reusable filtering component
5. `ModalContainer.tsx` - Consistent modal behavior
6. `ProjectAvatar.tsx` - Specific but reusable

**Estimated Impact**:

- Code reduction: ~100 lines
- Files affected: 3

### Phase 3: Polish (Lower Impact)

7-16. Typography, grid, and other utility components

---

## 5. Summary Statistics

| Metric                     | Current | After Extraction | Improvement    |
| -------------------------- | ------- | ---------------- | -------------- |
| Duplicate code blocks      | 12+     | 0-2              | 83%+ reduction |
| Status color definitions   | 2       | 1                | 50% reduction  |
| Motion variant definitions | 4       | 1                | 75% reduction  |
| Section container patterns | 3+      | 1                | 66%+ reduction |

---

## 6. Next Steps

1. **Review and approve** this analysis
2. **Create** `src/components/primitives/` directory
3. **Implement Phase 1 components** (SectionContainer, StatusBadge, AnimatedContainer)
4. **Refactor existing components** to use new primitives
5. **Run tests** to ensure no regressions
6. **Update documentation** with primitive usage examples

---

## 7. File References

**Components Analyzed**:

- `src/components/Hero.tsx:1-120` - Motion variants, responsive text
- `src/components/ProjectsGallery.tsx:1-200` - Grid layout, filters
- `src/components/ProjectCard.tsx:1-150` - Card patterns, status badges
- `src/components/ProjectModal.tsx:1-250` - Modal patterns, image carousel
- `src/components/Footer.tsx:1-80` - Section container, links
- `src/components/NavLink.tsx:1-40` - Hover patterns
- `src/components/TopographicBackground.tsx:1-100` - SVG animations

**shadcn/ui Components** (`src/components/ui/`):

- Already provide: button, card, badge, dialog, input, scroll-area, separator, skeleton
- These primitives should complement, not duplicate, shadcn/ui components
