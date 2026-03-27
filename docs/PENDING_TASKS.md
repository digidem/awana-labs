# Pending Tasks

The following tasks from the removed root `.md` files are still pending:

## BUILD_CONFIG_REVIEW.md
- [ ] **BC-06**: Update placeholder OpenGraph images in `index.html`

## VERIFICATION_REPORT.md
- [ ] **LT-03**: Fix empty object type interfaces in `command.tsx` and `textarea.tsx`

## COMPONENT_AUDIT_REPORT.md
- [ ] **CD-02**: Add `useReducedMotion` check to `Footer.tsx`
- [ ] **CD-03**: Audit and remove unused shadcn/ui imports
- [ ] **CD-05**: Create animation variants library
- [ ] **CD-06**: Create `useProjectStatus` hook
- [ ] **CD-07**: Remove index prop from `ProjectCard`

## HOOKS_STATE_MANAGEMENT_EVALUATION.md
- [ ] **HS-01**: Delete duplicate `use-toast.ts` re-export
- [ ] **HS-02**: Choose between shadcn/ui Toast and Sonner, remove the other
- [ ] **HS-04**: Standardize React imports (use named imports)
- [ ] **HS-06**: Extract `useModal` hook for keyboard navigation

## TEST_ANALYSIS_REPORT.md
- [ ] **TC-03**: Remove "Time to First Contentful Paint" test - no assertions
- [ ] **TC-04**: Remove "projects.json data loads" test - no assertions
- [ ] **TC-05**: Consolidate page load tests (4 tests → 1)
- [ ] **TC-06**: Consolidate responsive viewport tests
- [ ] **TC-07**: Replace arbitrary timeouts with proper waits

## LAYOUT_UI_PRIMITIVES_ANALYSIS.md
- [ ] **UP-01**: Create `SectionContainer.tsx` primitive
- [ ] **UP-02**: Create `StatusBadge.tsx` primitive
- [ ] **UP-03**: Create `AnimatedContainer.tsx` primitive
- [ ] **UP-04**: Create `FilterPills.tsx` component
- [ ] **UP-05**: Create `ModalContainer.tsx` component
- [ ] **UP-06**: Create `ProjectAvatar.tsx` component

## STANDARDIZATION_RECOMMENDATIONS.md
- [ ] **SS-01**: Add semantic status tokens to `src/index.css`
- [ ] **SS-02**: Add status colors to `tailwind.config.ts`
- [ ] **SS-03**: Create `src/lib/status-utils.ts` utility
- [ ] **SS-04**: Define semantic spacing scale in `tailwind.config.ts`
- [ ] **SS-05**: Create `src/lib/transitions.ts` utility
- [ ] **SS-06**: Review and clean up `src/App.css`

## TEST_COVERAGE_AUDIT.md
- [ ] **COV-02**: Add tests for `ProjectCard` component
- [ ] **COV-03**: Add tests for `ProjectModal` component
- [ ] **COV-04**: Add tests for `ProjectsGallery` filtering
- [ ] **COV-05**: Add tests for `use-toast` hook
- [ ] **COV-06**: Add tests for `Index` page
- [ ] **COV-07**: Add tests for `Hero` component
- [ ] **COV-08**: Add E2E test for critical user flows

## RESPONSIVENESS_REPORT.md
- [ ] **RF-01**: Fix Hero section text overflow on small mobile
- [ ] **RF-02**: Improve Project Modal button layout on small screens
- [ ] **RF-03**: Optimize search bar width for medium tablets

## REFACTOR_PLAN.md
- [ ] **W1-01**: Enable TypeScript strict mode
- [ ] **W1-02**: Add typecheck script to package.json
- [ ] **W1-03**: Fix all TypeScript errors
- [ ] **W1-04**: Run and fix all ESLint warnings
- [ ] **W1-05**: Create dedicated hooks directory structure
- [ ] **W2-01**: Extract status constants to `src/constants/status.ts`
- [ ] **W2-02**: Extract usage labels to `src/constants/labels.ts`
- [ ] **W2-03**: Create shared project utilities in `src/lib/project.ts`
- [ ] **W2-04**: Consolidate animation variants to `src/lib/animations.ts`
- [ ] **W2-05**: Create `src/constants/index.ts` barrel export
- [ ] **W3-01**: Create `src/hooks/useProjects.ts` custom hook
- [ ] **W3-02**: Add error boundary component
- [ ] **W3-03**: Add loading skeleton component
- [ ] **W3-04**: Implement proper error handling in useProjects
- [ ] **W3-05**: Add data fetching retry logic
- [ ] **W4-01**: Audit all components for ARIA attributes
- [ ] **W4-02**: Add missing aria-labels to interactive elements
- [ ] **W4-03**: Ensure keyboard navigation works everywhere
- [ ] **W4-04**: Fix responsiveness issues across breakpoints
- [ ] **W4-05**: Add focus-visible styling
- [ ] **W8-03**: Replace fetch calls with Octokit