# Repository Guidelines

## Quick Commands

- `npm run dev`: start the Vite dev server with HMR.
- `npm run build`: production build to `dist/`.
- `npm run preview`: serve the production build locally.
- `npm run lint`: run ESLint across the repo.
- `npm run typecheck`: run TypeScript type checking without emitting files.
- `npm run test`: run Vitest in CI mode.
- `npm run test:e2e`: run Playwright tests headlessly.
- `npm run test:e2e:ui`: open the Playwright UI runner.
- `npm run fetch:projects`: run `scripts/fetch-projects.ts` via Bun.

## Tech Stack & Boundaries

- Stack: React 18, TypeScript 5, Vite 5, Tailwind CSS 3, shadcn/ui, Vitest, Playwright. citeturn1view0
- Always: follow existing patterns in `src/`, keep UI changes in React components, and run relevant tests for changes.
- Ask first: adding new dependencies, changing build/test tooling, or altering verification scripts.
- Never: edit `node_modules/`, commit secrets, or change generated `dist/` outputs.

## Project Structure & Module Organization

- `src/` contains app code: `src/pages/` (route views), `src/components/` (reusable UI), `src/hooks/` (React hooks), `src/lib/` (helpers), `src/types/` (shared TS types), `src/test/` (unit test utilities/specs).
- `public/` holds static assets served as-is.
- `e2e/` and `e2e-live/` contain Playwright end-to-end tests.
- `scripts/` contains automation scripts.
- `dist/` is build output (generated).

## Coding Style & Naming Conventions

- Indentation follows existing files (2 spaces typical). Prefer explicit types for shared models in `src/types/`.
- Component names use `PascalCase` (e.g., `ProjectCard.tsx`). Hooks use `useX` (e.g., `useProjects.ts`).
- Linting is enforced with ESLint (`eslint.config.js`).

Example style:

```tsx
type Project = { id: string; title: string };

export function ProjectCard({ project }: { project: Project }) {
  return <div className="rounded-lg p-4">{project.title}</div>;
}
```

## Testing & Verification

- Unit/integration tests use Vitest. Place tests near source or under `src/test/` and name with `.test.ts`/`.test.tsx`.
- E2E tests use Playwright under `e2e/` (and `e2e-live/` for live scenarios).
- Verification scripts live in `scripts/` with results tracked in `VERIFICATION_REPORT.md`.

Common verification commands:

- `npm run test:e2e -- verify-projects.spec.ts`
- `node scripts/verify-site.mjs`
- `node scripts/verify-detailed.mjs`
- `node scripts/final-verification.mjs`

## Commit & Pull Request Guidelines

- Commit messages follow Conventional Commits (examples in history: `feat: …`, `fix: …`, `chore: …`).
- PRs should include a clear description, testing notes, and screenshots for UI changes. Link relevant issues when applicable.
- **Git Hooks**: Husky enforces pre-commit (lint-staged) and pre-push (typecheck) validation. See `docs/TYPECHECK_RATIONALE.md` for details.

## Security & Configuration Tips

- Keep secrets out of the repo. Use `.env` files for local configuration (do not commit). Document any new env vars added.
