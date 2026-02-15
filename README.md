# Awana Labs Projects Showcase

A modern, responsive web application for showcasing projects with multi-language support. Built with React, TypeScript, and Tailwind CSS.

## Features

- **Project Gallery**: Display projects with detailed information including status, tags, and media
- **Internationalization**: Multi-language support with i18next and automatic language detection
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Modern UI Components**: Built with shadcn/ui and Radix UI primitives
- **Type Safety**: Full TypeScript support with Zod schemas for validation
- **Testing**: Comprehensive unit and end-to-end testing with Vitest and Playwright
- **State Management**: React Query for efficient data fetching and caching

## Tech Stack

- **Framework**: React 19 with TypeScript 5
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3
- **UI Components**: shadcn/ui, Radix UI
- **Routing**: React Router DOM 7
- **State Management**: TanStack React Query
- **Internationalization**: i18next, react-i18next
- **Forms**: React Hook Form with Zod validation
- **Testing**: Vitest, Playwright, React Testing Library
- **Package Manager**: npm (with Bun for scripts)

## Installation

### Prerequisites

- Node.js (recommended to use [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) for version management)
- npm

### Steps

```bash
# Clone the repository
git clone <your-repository-url>
cd awana-labs-showcase

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at `http://localhost:5173`

## Build

```bash
# Production build (for GitHub Pages deployment)
npm run build

# Development build (for local testing without GitHub Pages base path)
npm run build:dev

# Preview production build locally
npm run preview
```

### Build Modes

This project uses Vite's mode feature to configure different base paths:

- **Production mode** (`npm run build`): Builds with base path `/awana-labs-showcase/` for GitHub Pages deployment
- **Development mode** (`npm run build:dev`): Builds with base path `/` for local testing or alternative deployment environments

Use `build:dev` when you need to:

- Test the production build locally without the GitHub Pages prefix
- Deploy to a custom domain or root path
- Debug build-specific issues in development mode

## Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run end-to-end tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug
```

## Scripts

- `npm run dev` - Start development server with hot module replacement
- `npm run build` - Build for production with GitHub Pages base path
- `npm run build:dev` - Build for development mode with root base path (useful for local testing or custom deployments)
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run test` - Run unit tests with Vitest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:e2e` - Run Playwright end-to-end tests
- `npm run test:e2e:ui` - Run Playwright tests with UI
- `npm run test:e2e:debug` - Run Playwright tests in debug mode
- `npm run fetch:projects` - Fetch projects data (requires Bun)

## Internationalization (i18n)

This project uses [i18next](https://www.i18next.com/) with automatic language detection via [i18next-browser-languagedetector](https://github.com/i18next/i18next-browser-languageDetector).

### Supported Languages

- **English (en)** - Default
- **Portuguese (pt)**
- **Spanish (es)**

### Language Detection & Fallback Rules

The application automatically detects the user's preferred language using the following priority order:

1. **Query String Parameter** (`?lng=pt`)
   - Highest priority
   - Useful for sharing links with specific language
   - Example: `https://example.com?lng=es`

2. **Cookie** (`i18next`)
   - Persisted language preference
   - Set automatically when user changes language

3. **localStorage** (`i18nextLng`)
   - Browser-stored preference
   - Survives page reloads
   - Most common persistence method

4. **sessionStorage** (`i18nextLng`)
   - Session-based preference
   - Cleared when browser tab closes

5. **Browser Navigator Language**
   - Detects from `navigator.language` or `navigator.languages`
   - Uses browser's language settings
   - Automatically maps regional variants (e.g., `pt-BR` → `pt`)

6. **HTML Tag** (`<html lang="...">`)
   - Fallback to HTML document language attribute

### Fallback Behavior

- **Unsupported Languages**: If a detected language is not in the supported list, the application falls back to **English (en)**
- **Missing Translations**: If a translation key is missing in the selected language, it falls back to the English translation
- **Invalid Language Codes**: Non-standard or malformed language codes default to English

### Changing Language Programmatically

```typescript
import i18n from "./lib/i18n";

// Change language
await i18n.changeLanguage("pt");

// Get current language
const currentLang = i18n.language;

// Get supported languages
import { supportedLanguages } from "./lib/i18n";
console.log(supportedLanguages); // ['en', 'pt', 'es']
```

### Adding a New Language

1. Create a new translation file in `src/locales/[language-code]/common.json`
2. Add the language to the resources object in `src/lib/i18n.ts`
3. Add the language code to the `supportedLanguages` array
4. Add translations for all existing keys

Example:

```typescript
// src/lib/i18n.ts
const resources = {
  en: { translation: en },
  pt: { translation: pt },
  es: { translation: es },
  fr: { translation: fr }, // New language
};

export const supportedLanguages = ["en", "pt", "es", "fr"] as const;
```

### Language Detection Configuration

The language detector is configured with the following settings:

- **Detection Order**: Prioritizes explicit user preferences (query params, cookies, localStorage) over implicit detection (browser settings)
- **Caching**: User language selections are cached in both localStorage and cookies for persistence
- **Whitelist Checking**: Only languages in `supportedLngs` are accepted, ensuring fallback to default for unsupported languages

See `src/lib/i18n.ts` for the complete configuration.

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── ui/          # shadcn/ui components
│   ├── Header.tsx   # Site header with navigation
│   ├── Footer.tsx   # Site footer
│   ├── Hero.tsx     # Hero section
│   └── Project*.tsx # Project-related components
├── hooks/           # Custom React hooks
│   └── use*.ts      # Hook implementations and tests
├── lib/             # Utility functions and configurations
│   ├── api.ts       # API utilities
│   ├── i18n.ts      # Internationalization setup
│   └── utils.ts     # General utilities
├── locales/         # Translation files
│   ├── en/          # English translations
│   ├── pt/          # Portuguese translations
│   └── es/          # Spanish translations
├── pages/           # Route components
│   ├── Index.tsx    # Home page
│   └── NotFound.tsx # 404 page
├── types/           # TypeScript type definitions
│   └── *.ts         # Type definitions and schemas
├── test/            # Test utilities and setup
└── main.tsx         # Application entry point
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the existing code style
4. Run tests and linting (`npm run test && npm run lint`)
5. Commit your changes using [Conventional Commits](https://www.conventionalcommits.org/)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Guidelines

- Follow the existing code style (2 spaces indentation)
- Use TypeScript for type safety
- Write tests for new features and utilities
- Run `npm run typecheck` before committing
- Ensure all tests pass before submitting a PR
- Follow the project's commit message conventions

## Git Hooks & CI Enforcement

This project uses a layered quality enforcement strategy to maintain code standards:

### Local Development (Git Hooks)

Husky and lint-staged are configured to run quality checks automatically:

- **Pre-commit**: Runs ESLint on staged files via lint-staged
- **Pre-push**: Runs full TypeScript type checking

These hooks provide immediate feedback and prevent issues from being committed.

#### Skipping Git Hooks (Use Sparingly)

In rare cases where you need to bypass Git hooks, use the `--no-verify` flag:

```bash
# Skip pre-commit hooks (linting)
git commit --no-verify -m "message"

# Skip pre-push hooks (typecheck)
git push --no-verify
```

**⚠️ Warning**: Skipping hooks should only be used for:

- Documentation-only changes
- Temporary work-in-progress commits
- Emergency fixes that will be properly tested later
- Known false positives from linters

**Note**: Even if you skip local hooks, CI will still enforce all quality checks on pull requests.

### CI Enforcement (GitHub Actions)

The CI pipeline runs automatically on every push and pull request:

1. **E2E Tests** ([test-e2e.yml](.github/workflows/test-e2e.yml)) - Runs Playwright tests on all push and PR events
2. **Deployment** ([deploy.yml](.github/workflows/deploy.yml)) - Builds and deploys to GitHub Pages from main branch
3. **Live Site Tests** ([test-deployed.yml](.github/workflows/test-deployed.yml)) - Tests the deployed site after successful deployment

#### CI Quality Gates

The CI pipeline enforces the following quality standards:

- ✅ All Playwright E2E tests must pass
- ✅ Build must complete successfully
- ✅ Deployed site must pass live smoke tests

These checks cannot be bypassed and must pass before any code is merged to main.

### Alignment Strategy

| Check      | Local Hook                | CI Pipeline           | Fallback                       |
| ---------- | ------------------------- | --------------------- | ------------------------------ |
| ESLint     | Pre-commit (staged files) | No (local only)       | Manual `npm run lint`          |
| TypeScript | Pre-push (full check)     | Implicit in build     | Build will fail on type errors |
| E2E Tests  | No                        | Yes, on every push/PR | Manual `npm run test:e2e`      |

This strategy provides:

- **Fast feedback** via local hooks
- **Comprehensive validation** via CI
- **No single point of failure** - if local hooks fail, CI still protects the codebase

## License

[Add your license here]

## Support

For issues and questions, please open an issue on the repository.
