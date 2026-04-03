# Awana Labs

[![Deploy to GitHub Pages](https://github.com/digidem/awana-labs/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/digidem/awana-labs/actions/workflows/deploy.yml)
[![E2E Tests](https://github.com/digidem/awana-labs/actions/workflows/test-e2e.yml/badge.svg?branch=main)](https://github.com/digidem/awana-labs/actions/workflows/test-e2e.yml)

Showcase for Awana Labs. Its goal is to build tech tools that resolve users' workflow problems using our apps, APIs, and support materials.

This site fetches published project data from GitHub, validates it at runtime, caches it locally, and renders it as a multilingual, searchable gallery.

## What It Does

- Presents the Awana Labs mission and project portfolio in one public place
- Publishes project entries from GitHub issues labeled `publish:yes`
- Validates project data before it reaches the UI
- Caches validated data in `localStorage` for fast reloads and offline fallback
- Supports English, Portuguese, and Spanish
- Lets users filter projects by status and search by title, description, or tag
- Includes unit and end-to-end verification for the runtime data contract

## How Content Gets Into The Site

This app uses GitHub as a lightweight content source.

1. Create or update an issue in the source repository
2. Format the issue body using the project sections expected by the fetcher
3. Add the `publish:yes` label
4. The frontend fetches those issues from the GitHub API at runtime
5. The payload is parsed, validated, cached, and rendered in the gallery

## Quick Start

### Prerequisites

- Node.js
- npm

### Install and Run

```bash
git clone git@github.com:digidem/awana-labs.git
cd awana-labs
npm install
npm run dev
```

The development server runs at `http://localhost:8080`.

## Configuration

Optional frontend environment variables:

```bash
VITE_GITHUB_OWNER=digidem
VITE_GITHUB_REPO=awana-labs
VITE_GITHUB_LABEL=publish:yes
```


## Scripts

```bash
npm run dev
npm run build
npm run build:dev
npm run preview
npm run lint
npm run typecheck
npm run test
npm run test:e2e
```

## Runtime Behavior

- Fresh data is fetched from GitHub on cold start when no valid cache exists
- Valid responses are cached in `localStorage`
- Fresh cache is reused to reduce unnecessary requests
- Stale cache can be served while a background refresh runs
- Cached data is used as a fallback when offline or when GitHub refreshes fail
- GitHub rate-limit failures fall back to cached data when available

## Testing

This repository includes unit and end-to-end verification for the fetch and rendering flow.

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`

The E2E suite covers cold-start fetches, invalid cache rejection, and offline fallback.

## Project Structure

- `src/pages/` route views
- `src/components/` reusable UI components
- `src/hooks/` React hooks
- `src/lib/` runtime fetch, parsing, cache, and utility code
- `src/types/` shared TypeScript and schema types
- `src/locales/` translations
- `e2e/` Playwright tests
- `scripts/` automation and verification scripts

## Contributing

Keep changes small and verify them before opening a PR:

```bash
npm run lint
npm run typecheck
npm run test
```

If you change runtime project data behavior, run the relevant Playwright coverage too.
