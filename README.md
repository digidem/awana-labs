# Awana Labs Projects Showcase

A modern, responsive web application for showcasing projects with multi-language support. Built with React, TypeScript, and Tailwind CSS.

## Features

- **Project Gallery**: Display projects with detailed information including status, tags, and media
- **Internationalization**: Multi-language support with i18next
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
# Production build
npm run build

# Preview production build locally
npm run preview
```

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
- `npm run build` - Build for production
- `npm run build:dev` - Build for development mode
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run test` - Run unit tests with Vitest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:e2e` - Run Playwright end-to-end tests
- `npm run test:e2e:ui` - Run Playwright tests with UI
- `npm run test:e2e:debug` - Run Playwright tests in debug mode
- `npm run fetch:projects` - Fetch projects data (requires Bun)

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

## License

[Add your license here]

## Support

For issues and questions, please open an issue on the repository.
