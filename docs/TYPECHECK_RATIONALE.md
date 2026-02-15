# TypeScript Type Checking Integration

## Overview

This document explains the rationale for integrating TypeScript type checking into the Git workflow via Husky hooks.

## Current Setup

### 1. TypeCheck Script

Location: `package.json`

```json
"typecheck": "tsc --noEmit"
```

**Purpose**: Runs TypeScript compiler in check-only mode without emitting JavaScript files.

### 2. Git Hook Integration

#### Pre-Commit Hook (via lint-staged)

Location: `.husky/pre-commit`

```bash
npx lint-staged
```

Configuration in `package.json`:

```json
"lint-staged": {
  "*.{ts,tsx}": [
    "tsc --noEmit --skipLibCheck"
  ]
}
```

**When it runs**: Before each commit, on staged TypeScript files only.
**Flags**:

- `--noEmit`: Don't generate output files
- `--skipLibCheck`: Skip type checking of declaration files (faster)

#### Pre-Push Hook

Location: `.husky/pre-push`

```bash
npm run typecheck
```

**When it runs**: Before pushing to remote repository.
**Scope**: Full project type check without `--skipLibCheck`.

## Rationale

### Two-Tier Validation Strategy

#### Tier 1: Pre-Commit (Fast & Targeted)

- **Speed-optimized**: Only checks staged files with `--skipLibCheck`
- **Developer-friendly**: Quick feedback loop during development
- **Prevents**: Most type errors from entering version control
- **Trade-off**: May miss some library type issues

#### Tier 2: Pre-Push (Comprehensive)

- **Complete validation**: Full project typecheck without skipping libraries
- **Safety net**: Catches issues that pre-commit might miss
- **CI/CD alignment**: Matches what CI pipeline will check
- **Trade-off**: Slower, but runs less frequently

### Benefits of This Approach

1. **Fast Developer Feedback**
   - Pre-commit runs quickly on individual files
   - Developers get immediate feedback without slowing down workflow
   - Reduces friction in the development process

2. **Comprehensive Safety**
   - Pre-push ensures entire project type-checks before sharing
   - Prevents pushing broken code to remote repository
   - Reduces CI/CD failures and wasted build time

3. **Type Safety Guarantees**
   - TypeScript catches many runtime errors at compile time
   - Ensures API contracts are respected across the codebase
   - Improves code quality and maintainability

4. **Team Collaboration**
   - Everyone on the team gets the same validation
   - Automated enforcement prevents type errors from being overlooked
   - Reduces review burden by catching issues before PR creation

### Alternative Approaches Considered

#### Option 1: Only Pre-Commit

**Rejected**: Would slow down commits too much with full project checks.

#### Option 2: Only Pre-Push

**Rejected**: Would allow type errors to be committed, making git history less clean.

#### Option 3: Only in CI/CD

**Rejected**: Feedback too slow, wastes CI resources, frustrates developers.

#### Selected: Hybrid Approach (Current)

**Benefits**: Balances speed with safety, provides fast feedback and comprehensive validation.

## Maintenance

### Updating TypeScript Configuration

When modifying `tsconfig.json`, ensure:

- `noEmit` is enabled in the config
- Strict mode settings are maintained
- Path aliases are correctly configured

### Skipping Hooks (Emergency Use Only)

```bash
# Skip pre-commit (not recommended)
git commit --no-verify

# Skip pre-push (use with extreme caution)
git push --no-verify
```

**Warning**: Only use `--no-verify` in emergency situations. Address type errors properly rather than bypassing checks.

### Handling Type Errors

1. **Fix at source**: Resolve the actual type mismatch
2. **Update types**: If types are outdated, update dependencies
3. **Type assertions**: Use sparingly and only when you're certain
4. **@ts-expect-error**: Document why error is expected

## Metrics

### Performance Targets

- Pre-commit typecheck: < 5 seconds (targeted to staged files)
- Pre-push typecheck: < 30 seconds (full project)

### Success Criteria

- Zero type errors in main branch
- < 5% of commits use `--no-verify`
- Type errors caught before CI/CD 95%+ of the time

## Troubleshooting

### Common Issues

#### "Property does not exist" errors

- Usually indicates missing or outdated type definitions
- Check for `@types/*` packages
- Update dependencies if needed

#### Slow typecheck performance

- Consider excluding large generated files in `tsconfig.json`
- Check if dependencies can be updated
- Use `skipLibCheck` more aggressively in development

#### Hook not running

- Ensure Husky is installed: `npm run prepare`
- Check hook file permissions: `chmod +x .husky/pre-commit`
- Verify Git hooks path: `git config core.hooksPath`

## References

- [TypeScript Compiler Options](https://www.typescriptlang.org/docs/handbook/compiler-options.html)
- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)
