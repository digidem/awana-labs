# Repository Guidelines

## Do

- Follow existing patterns in `src/` and keep UI work in React components.
- Run relevant verification after changes (`lint`, `typecheck`, tests).
- Use explicit shared types in `src/types/` when adding cross-module models.
- Keep component names in `PascalCase` and hooks in `useX` format.
- Keep changes scoped to source, tests, and docs; leave generated artifacts alone.

## Don't

- Don't edit `node_modules/` or commit generated `dist/` output.
- Don't commit secrets or `.env` values.
- Don't add dependencies or change build/test tooling without user approval.
- Don't alter verification scripts in `scripts/` without user approval.

## Commands

- `npm run dev` - Start Vite dev server with HMR.
- `npm run build` - Create production build in `dist/`.
- `npm run preview` - Serve production build locally.
- `npm run lint` - Run ESLint.
- `npm run typecheck` - Run TypeScript checks without emit.
- `npm run test` - Run Vitest in CI mode.
- `npm run test:e2e` - Run Playwright tests headlessly.
- `npm run test:e2e:ui` - Open Playwright UI runner.
- `npm run test:e2e -- verify-projects.spec.ts` - Run targeted E2E verification.
- `node scripts/verify-site.mjs` - Run site verification script.
- `node scripts/verify-detailed.mjs` - Run detailed verification script.
- `node scripts/final-verification.mjs` - Run final verification script.

## Safety and Permissions

- Ask first before adding dependencies.
- Ask first before changing build tooling, test tooling, or verification scripts.
- Keep secrets out of version control; use local `.env` files only.

## Project Structure Hints

- `src/pages/` - Route views.
- `src/components/` - Reusable UI components.
- `src/hooks/` - React hooks.
- `src/lib/` - Utility helpers.
- `src/types/` - Shared TypeScript types.
- `src/test/` - Unit/integration test utilities and specs.
- `public/` - Static assets served as-is.
- `e2e/` and `e2e-live/` - Playwright end-to-end tests.
- `scripts/` - Automation and verification scripts.

## PR Checklist

- Use Conventional Commits (`feat:`, `fix:`, `chore:`).
- Include a clear change summary and testing notes.
- Include screenshots for UI changes.
- Link related issues when applicable.
- Ensure Husky hooks pass (`pre-commit` lint-staged, `pre-push` typecheck).

## When Stuck

- Re-read nearby code to match existing patterns before introducing new abstractions.
- Prefer the smallest safe change, then validate with `npm run lint` and `npm run typecheck`.
- If behavior is unclear, add or run the closest relevant test before refactoring.
