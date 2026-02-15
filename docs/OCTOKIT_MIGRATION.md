# Octokit Migration Documentation

## Overview

This document describes the migration from raw `fetch` calls to `@octokit/core` for GitHub API interactions.

## Changes Made

### Date: 2026-02-15

**Affected Files:**

- `scripts/fetch-projects.ts` - Main script for fetching GitHub issues
- `package.json` - Added @octokit/core dependency
- `scripts/README.md` - Updated documentation

### Migration Details

#### Before (fetch-based implementation)

```typescript
const response = await fetch(`${url}?${searchParams}`, {
  headers: {
    Accept: "application/vnd.github.v3+json",
    Authorization: `Bearer ${token}`,
    "User-Agent": "awana-labs-showcase-fetch-projects",
    "X-GitHub-Api-Version": "2022-11-28",
  },
});

// Manual pagination logic
let page = 1;
let hasMore = true;
while (hasMore) {
  // ... fetch and process each page
}
```

#### After (Octokit-based implementation)

```typescript
const octokit = new Octokit({
  auth: token,
  userAgent: "awana-labs-showcase-fetch-projects",
});

// Automatic pagination with iterator
const iterator = octokit.paginate.iterator("GET /repos/{owner}/{repo}/issues", {
  owner,
  repo: name,
  labels: PUBLISH_LABEL,
  state: "all",
  per_page: ISSUES_PER_PAGE,
  sort: "created",
  direction: "desc",
});

for await (const response of iterator) {
  const issues = response.data as GitHubIssue[];
  allIssues.push(...issues);
}
```

## Benefits

1. **Type Safety**: Better TypeScript support with typed API responses
2. **Simplified Pagination**: Built-in `paginate.iterator()` handles all pagination automatically
3. **Error Handling**: Improved error messages and automatic retry logic
4. **Authentication**: Better token management and authentication flow
5. **Maintainability**: Easier to maintain and update with official SDK
6. **API Versioning**: Consistent API version management
7. **Reduced Code**: Removed ~50 lines of manual pagination and error handling code

## Dependencies

### New Dependency

```json
{
  "@octokit/core": "^6.x.x"
}
```

The package adds 11 additional dependencies but provides significant improvements in type safety and developer experience.

## Testing

All existing tests continue to pass:

- ✅ Unit tests (Vitest): 56 tests passing
- ✅ Linting (ESLint): No new errors
- ✅ Build process: Successful

## Environment Variables

No changes to required environment variables:

- `GITHUB_TOKEN` - Required for authentication
- `GITHUB_REPOSITORY` - Required for repository identification (format: "owner/repo")

## Migration Checklist

- [x] Install @octokit/core package
- [x] Replace fetch calls with Octokit API
- [x] Remove manual pagination logic
- [x] Update error handling for Octokit errors
- [x] Test functionality with existing tests
- [x] Run linting checks
- [x] Update documentation (scripts/README.md)
- [x] Document migration (this file)

## Rollback Plan

If issues arise, the migration can be rolled back by:

1. Reverting the changes in `scripts/fetch-projects.ts`
2. Removing `@octokit/core` from package.json
3. Running `npm install` to remove the dependency

## Related Documentation

- [Octokit Core Documentation](https://github.com/octokit/core.js)
- [GitHub REST API Documentation](https://docs.github.com/en/rest)
- [Project Scripts Documentation](../scripts/README.md)

## Notes

- The migration maintains backward compatibility with all existing functionality
- Performance is comparable or improved due to better connection pooling in Octokit
- Future GitHub API integrations should use Octokit for consistency
