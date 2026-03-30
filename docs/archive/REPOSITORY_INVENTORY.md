# PRD: Awana Labs Showcase - Repository Structure & Module Boundaries

## Overview

**Project**: Awana Labs Showcase Website
**Type**: Static project portfolio / showcase platform
**Stack**: React 19.2.4, TypeScript 5.9.3, Vite 7.3.1, Tailwind CSS 3.4.19, shadcn/ui

This is a modern, performant single-page application that displays projects sourced from GitHub Issues. The application uses static data pre-rendering for optimal performance and SEO.

---

## Repository Structure

```
awana-labs-showcase/
├── src/                          # Application source code
│   ├── components/               # React UI components
│   │   ├── ui/                  # shadcn/ui primitive components (40+ files)
│   │   ├── Hero.tsx             # Landing hero section with animations
│   │   ├── ProjectCard.tsx      # Individual project display card
│   │   ├── ProjectModal.tsx     # Project detail modal dialog
│   │   ├── ProjectsGallery.tsx  # Main projects grid with search/filter
│   │   ├── Footer.tsx           # Site footer component
│   │   ├── NavLink.tsx          # Navigation link wrapper
│   │   └── TopographicBackground.tsx  # Animated SVG background
│   ├── hooks/                   # Custom React hooks
│   │   ├── use-mobile.tsx       # Mobile breakpoint detection hook
│   │   └── use-toast.ts         # Toast notification management
│   ├── lib/                     # Utility libraries
│   │   └── utils.ts             # Class name merging (clsx + tailwind-merge)
│   ├── pages/                   # Route page components
│   │   ├── Index.tsx            # Home page (main route)
│   │   └── NotFound.tsx         # 404 error page
│   ├── types/                   # TypeScript type definitions
│   │   └── project.ts           # Project data model/types
│   ├── test/                    # Test utilities & setup
│   │   ├── setup.ts             # Vitest configuration
│   │   └── example.test.ts      # Example test file
│   ├── App.tsx                  # Root application component
│   ├── App.css                  # Global styles
│   ├── main.tsx                 # Application entry point
│   ├── vite-env.d.ts            # Vite TypeScript declarations
│   └── index.css                # Global CSS with Tailwind directives
├── public/                      # Static assets (served as-is)
│   └── projects.json            # Pre-fetched project data
├── e2e/                         # Playwright E2E tests
│   ├── basic.spec.ts            # Basic smoke tests
│   ├── verify-projects.spec.ts  # Project display verification
│   └── projects.spec.ts         # Projects feature tests
├── scripts/                     # Automation & build scripts
│   ├── fetch-projects.ts        # Fetch projects from GitHub Issues
│   ├── parse-issue.ts           # Issue parsing utilities
│   ├── verify-site.mjs          # Site verification script
│   ├── verify-detailed.mjs      # Detailed verification
│   └── final-verification.mjs   # Pre-deployment verification
├── dist/                        # Build output (generated, not committed)
├── package.json                 # Dependencies & scripts
├── vite.config.ts               # Vite build configuration
├── tsconfig.json                # TypeScript configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── eslint.config.js             # ESLint linting rules
├── playwright.config.ts         # Playwright E2E test configuration
└── vitest.config.ts             # Vitest unit test configuration
```

---

## Module Boundaries & Responsibilities

### 1. Data Layer (`types/`, `public/`)

**Purpose**: Type definitions and static data storage

**Responsibilities**:

- Define TypeScript interfaces for project data
- Store pre-fetched project data as JSON
- Serve as source of truth for application data

**Key Files**:

- `src/types/project.ts` - Project type definitions
- `public/projects.json` - Static project data

**Data Flow**:

```
GitHub Issues → fetch-projects.ts → projects.json → App
```

**Boundary Rules**:

- No business logic in types
- No API calls from types
- Static JSON only, no runtime data fetching in production

---

### 2. Presentation Layer (`components/`, `pages/`)

**Purpose**: UI rendering and user interaction

**Responsibilities**:

- Render UI components
- Handle user interactions (clicks, form inputs)
- Manage local UI state (modals, filters)
- Display data passed via props

**Key Files**:

- `src/pages/Index.tsx` - Home page route handler
- `src/pages/NotFound.tsx` - 404 page
- `src/components/Hero.tsx` - Hero section with animations
- `src/components/ProjectsGallery.tsx` - Projects grid with search/filter
- `src/components/ProjectCard.tsx` - Individual project card
- `src/components/ProjectModal.tsx` - Project detail modal
- `src/components/Footer.tsx` - Site footer
- `src/components/NavLink.tsx` - Navigation link wrapper
- `src/components/TopographicBackground.tsx` - Animated background
- `src/components/ui/*` - shadcn/ui primitives (40+ components)

**Boundary Rules**:

- Components should be pure and stateless where possible
- No direct data fetching from components (use hooks/lib layer)
- Props for data input, callbacks for events
- UI primitives in `components/ui/` should not contain business logic

**Component Hierarchy**:

```
App
├── HashRouter
│   ├── Index
│   │   ├── Hero
│   │   ├── ProjectsGallery
│   │   │   ├── ProjectCard
│   │   │   └── ProjectModal
│   │   └── Footer
│   └── NotFound
```

---

### 3. Logic Layer (`hooks/`, `lib/`)

**Purpose**: Reusable logic and utilities

**Responsibilities**:

- Provide reusable React hooks
- Offer utility functions
- Encapsulate cross-cutting concerns

**Key Files**:

- `src/hooks/use-mobile.tsx` - Mobile breakpoint detection
- `src/hooks/use-toast.ts` - Toast notification management
- `src/lib/utils.ts` - Class name merging utility

**Boundary Rules**:

- Hooks should be framework-agnostic where possible
- No direct UI rendering
- Pure functions preferred in lib/
- Hooks can use other hooks, but avoid circular dependencies

---

### 4. Application Layer (`App.tsx`, `main.tsx`)

**Purpose**: Application bootstrap and global configuration

**Responsibilities**:

- Initialize React application
- Configure global providers (QueryClient, Router, Theme)
- Set up routing
- Mount application to DOM

**Key Files**:

- `src/main.tsx` - Application entry point
- `src/App.tsx` - Root component with providers

**Boundary Rules**:

- Minimal business logic
- Provider configuration only
- No component composition (delegate to pages)

---

### 5. Testing Layer (`test/`, `e2e/`)

**Purpose**: Quality assurance and test coverage

**Responsibilities**:

- Unit tests for utilities and hooks
- Integration tests for components
- E2E tests for user workflows
- Test configuration and setup

**Key Files**:

- `src/test/setup.ts` - Vitest configuration
- `src/test/example.test.ts` - Example test
- `e2e/basic.spec.ts` - Basic smoke tests
- `e2e/verify-projects.spec.ts` - Project verification tests
- `e2e/projects.spec.ts` - Project feature tests

**Boundary Rules**:

- Tests should mirror src/ structure
- E2E tests focus on user workflows
- Unit tests focus on logic and utilities

---

### 6. Automation Layer (`scripts/`)

**Purpose**: Build automation and data pipeline

**Responsibilities**:

- Fetch projects from GitHub Issues
- Verify build output
- Validate data integrity
- Run pre-deployment checks

**Key Files**:

- `scripts/fetch-projects.ts` - Fetch projects from GitHub Issues
- `scripts/parse-issue.ts` - Issue parsing utilities
- `scripts/verify-site.mjs` - Site verification
- `scripts/verify-detailed.mjs` - Detailed verification
- `scripts/final-verification.mjs` - Pre-deployment verification

**Boundary Rules**:

- Scripts should be idempotent
- No runtime dependencies on src/
- Clear exit codes for CI/CD integration

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Issues (Source)                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              scripts/fetch-projects.ts                       │
│              (Parse & Transform Data)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              public/projects.json                            │
│              (Static Data Storage)                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              src/pages/Index.tsx                             │
│              (Data Fetching via TanStack Query)             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              src/components/ProjectsGallery.tsx              │
│              (Display & Filtering)                           │
└─────────────────────────────────────────────────────────────┘
```

---

## State Management Strategy

### Local State (useState)

- UI interactions (search input, filter selections)
- Modal open/close state
- Mobile menu toggle state

### Server State (TanStack Query)

- Project data caching and synchronization
- Automatic refetching on window focus
- Optimistic updates for better UX

### No Global State

- Application intentionally avoids Redux/Zustand
- State complexity is low enough for component-level state
- TanStack Query handles server state needs

---

## Key Technical Patterns

### 1. Static Data Approach

- Projects are pre-rendered from JSON
- No runtime API calls (except static JSON fetch)
- Benefits: Performance, SEO, simplicity

### 2. Hash-based Routing

- Uses HashRouter instead of BrowserRouter
- Simplified deployment, no server config needed
- Trade-off: Less clean URLs

### 3. Component Composition

- Components are composed of smaller pieces
- shadcn/ui primitives as building blocks
- Mixin-like behavior through hooks

### 4. Animation-First Design

- Framer Motion for all animations
- `prefer-reduced-motion` support
- Scroll-triggered animations

### 5. Type Safety

- Comprehensive TypeScript coverage
- Strong typing for project data
- Interface-based design

---

## Module Dependency Graph

```
main.tsx
  └─┬─ App.tsx
     ├─ QueryClientProvider (TanStack Query)
     ├─ TooltipProvider (shadcn/ui)
     ├─ ThemeProvider (next-themes)
     └─ HashRouter (React Router)
         ├─ Index.tsx (Page)
         │   ├─ Hero.tsx
         │   ├─ ProjectsGallery.tsx
         │   │   ├─ ProjectCard.tsx
         │   │   │   └─ components/ui/*
         │   │   ├─ ProjectModal.tsx
         │   │   │   └─ components/ui/*
         │   │   └─ use-mobile.tsx (Hook)
         │   └─ Footer.tsx
         └─ NotFound.tsx
```

---

## Tech Stack Details

### Core Framework

- **React**: 19.2.4 (UI framework)
- **TypeScript**: 5.9.3 (Type safety)
- **Vite**: 7.3.1 (Build tool & dev server)

### UI & Styling

- **Tailwind CSS**: 3.4.19 (Utility-first CSS)
- **shadcn/ui**: Custom components (Radix UI primitives)
- **Framer Motion**: 12.31.0 (Animations)
- **Lucide React**: 0.563.0 (Icons)

### Data & State

- **TanStack Query**: 5.90.20 (Server state management)
- **React Router DOM**: 7.13.0 (Client-side routing)
- **Zod**: 4.3.6 (Schema validation)

### Testing

- **Vitest**: 4.0.18 (Unit/integration tests)
- **Playwright**: 1.58.1 (E2E tests)
- **Testing Library**: 16.3.2 (Component testing)

### Build Tools

- **@vitejs/plugin-react-swc**: 4.2.3 (Fast React transforms)
- **PostCSS**: 8.5.6 (CSS processing)
- **Autoprefixer**: 10.4.24 (CSS vendor prefixes)

### Code Quality

- **ESLint**: 9.39.2 (Linting)
- **TypeScript ESLint**: 8.54.0 (TS linting)

---

## Architectural Decisions & Rationale

### Why Static Data?

- **Performance**: No runtime API overhead
- **SEO**: Search engines can index content
- **Simplicity**: No backend required
- **Reliability**: No API rate limits or downtime

### Why Hash Router?

- **Deployment**: Works on static hosting (GitHub Pages, S3)
- **Configuration**: No server-side routing needed
- **Trade-off**: URLs contain `#/` but acceptable for showcase

### Why TanStack Query for Static Data?

- **Caching**: Reduces redundant fetches
- **Refetching**: Automatic updates on window focus
- **Loading States**: Built-in loading/error handling
- **Future-Proof**: Easy to add dynamic data later

### Why shadcn/ui?

- **Customization**: Copy source code, full control
- **Radix UI**: Accessible primitives under the hood
- **Tailwind**: Consistent with styling approach
- **No Runtime**: No additional bundle size

---

## Module Boundaries Summary

| Module           | Responsibility                 | Input         | Output          | Dependencies       |
| ---------------- | ------------------------------ | ------------- | --------------- | ------------------ |
| **Data Layer**   | Type definitions, static data  | -             | Types, JSON     | None               |
| **Presentation** | UI rendering, user interaction | Props, events | UI elements     | Data, Logic layers |
| **Logic**        | Reusable hooks, utilities      | Params        | Computed values | None               |
| **Application**  | Bootstrap, providers           | -             | Mounted app     | All layers         |
| **Testing**      | Quality assurance              | Code          | Test results    | Source code        |
| **Automation**   | Build scripts, data pipeline   | GitHub issues | JSON, reports   | External APIs      |

---

## Notes for Future Development

### Adding New Features

1. **New Page**: Add to `src/pages/`, update `App.tsx` routing
2. **New Component**: Place in `src/components/` if reusable, `pages/` if page-specific
3. **New Hook**: Add to `src/hooks/` if reusable, component file if single-use
4. **New Type**: Add to `src/types/` if shared, component file if local

### Module Boundary Violations to Avoid

- Components fetching data directly (use hooks/lib)
- Types containing business logic (keep pure)
- Hooks rendering UI (return values only)
- Pages in `components/` (use `pages/` directory)
- Business logic in test files

---

_Last Updated: 2025-01-04_
_Document Version: 1.0_
