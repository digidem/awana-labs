# Test Notes

## fetch:projects Workflow Testing

### Completed: 2026-02-15

Testing of the `fetch:projects` workflow completed successfully.

### Bug Found and Fixed

**Issue**: The script at `scripts/fetch-projects.ts` was using `@octokit/core` which does not include pagination support. This caused the error:

```
Error: GitHub API error: undefined is not an object (evaluating 'octokit.paginate.iterator')
```

**Fix**: Changed the import from `@octokit/core` to `@octokit/rest` which includes built-in pagination.

### Tests Passed

- Delete data & re-fetch
- Parse issues correctly (2/2)
- Data integrity verified against GitHub API
- Error handling (invalid token, invalid repo, missing env vars)
- Lint
- TypeScript typecheck
- Dev server serves projects.json correctly

---

## Pre-existing Test Failure

### File: `src/test/husky-setup.test.ts`

**Test**: `pre-commit hook should contain lint command`

**Status**: Failing (unrelated to fetch:projects work)

**Issue**: The test expects the pre-commit hook to contain `npm run lint`, but the actual hook uses `npx lint-staged`:

```
Expected:  'npm run lint'
Received:  'npx lint-staged'
```

This is a pre-existing issue in the test suite, not related to the fetch:projects work.

**Recommendation**: Update the test to match the actual lint-staged configuration, or adjust the hook to use `npm run lint` directly.
