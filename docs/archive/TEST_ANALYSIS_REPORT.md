# Test Analysis Report: Flaky and Redundant Tests

**Generated:** 2026-02-04
**Repository:** awana-labs-showcase
**Test Framework:** Playwright (E2E), Vitest (Unit)

---

## Executive Summary

This report identifies flaky tests (prone to intermittent failures) and redundant tests (duplicate/overlapping coverage) in the test suite. Recommendations are provided for tests to remove, merge, or refactor.

**Key Findings:**

- 5 test files analyzed (4 E2E Playwright, 1 Vitest unit)
- 6 tests identified for removal (high flakiness or redundancy)
- 8 tests recommended for consolidation
- 1 file recommended for removal entirely

---

## Test Files Overview

| File                          | Type | Test Count | Status                             |
| ----------------------------- | ---- | ---------- | ---------------------------------- |
| `e2e/basic.spec.ts`           | E2E  | 19         | Has flaky/redundant tests          |
| `e2e/projects.spec.ts`        | E2E  | 16         | Has flaky/redundant tests          |
| `e2e/verify-projects.spec.ts` | E2E  | 1          | **REDUNDANT - Remove entire file** |
| `e2e-live/live.spec.ts`       | E2E  | 9          | Some flaky tests                   |
| `src/test/example.test.ts`    | Unit | 1          | Placeholder - no value             |

---

## 1. Tests to Remove (Flaky or Redundant)

### 1.1 Entire File Removal

#### `e2e/verify-projects.spec.ts` - **REMOVE ENTIRE FILE**

**Reason:** Complete duplication of `e2e/projects.spec.ts` tests

| Test                                       | Duplicate Coverage In                                              |
| ------------------------------------------ | ------------------------------------------------------------------ |
| "Verify both CoMapeo projects are visible" | `e2e/projects.spec.ts:38` - "CoMapeo project from GitHub Issue #2" |
| CoMapeo verification                       | `e2e/projects.spec.ts:38-54`                                       |
| Spreadsheet plugin verification            | `e2e/projects.spec.ts:86-104`                                      |

**Recommendation:** Delete this file entirely. All coverage exists in `projects.spec.ts`.

---

### 1.2 Individual Tests to Remove

#### From `e2e/basic.spec.ts`:

1. **"no console errors on page load" (line 39-62)** - **FLAKY**
   - **Issue:** Uses arbitrary `waitForTimeout(2000)` which may miss async errors
   - **Problem:** Console error detection is time-dependent and unreliable
   - **Better approach:** Use Playwright's `page.error` event with proper assertions

2. **"page is responsive (mobile viewport)" (line 64-72)** - **LOW VALUE**
   - **Issue:** Only checks body visibility, not actual responsive behavior
   - **Problem:** Doesn't verify responsive design features, just that body exists

3. **"page is responsive (desktop viewport)" (line 74-82)** - **LOW VALUE**
   - **Issue:** Same as above - trivial check
   - **Problem:** Doesn't validate actual desktop layout

4. **"Time to First Contentful Paint is reasonable" (line 220-239)** - **FLAKY + INCOMPLETE**
   - **Issue:** Complex PerformanceObserver logic that may time out
   - **Problem:** Test has no assertion (comment says "soft check") - provides no value

#### From `e2e/projects.spec.ts`:

5. **"projects.json data loads" (line 161-177)** - **NON-ASSERTING**
   - **Issue:** Test has no assertion - comment says "if it doesn't load, the page should still work"
   - **Problem:** This isn't a test - it's a comment

6. **"clicking project shows details (if modal exists)" (line 121-143)** - **NON-DETERMINISTIC**
   - **Issue:** Uses conditional logic based on element visibility
   - **Problem:** Test passes even if modal doesn't exist - provides false confidence

#### From `e2e-live/live.spec.ts`:

7. **"critical assets load successfully" (line 68-92)** - **FLAKY**
   - **Issue:** Allows up to 10 failed asset requests with only console.warn
   - **Problem:** Creates false confidence - site can have many broken assets and test still passes

8. **"no critical JavaScript errors" (line 95-131)** - **FLAKY**
   - **Issue:** Allows up to 5 critical errors
   - **Problem:** Arbitrary threshold undermines the test's purpose

---

## 2. Tests to Consolidate (Redundant Coverage)

### 2.1 Page Load Tests - **CONSOLIDATE**

**Duplicate Tests:**

- `basic.spec.ts:8` - "homepage loads successfully" (checks status 200, title, root)
- `basic.spec.ts:114` - "direct URL without hash loads homepage" (checks status 200, root)
- `live.spec.ts:20` - "site loads and responds" (checks status >=200, <400, URL)
- `live.spec.ts:33` - "site has proper HTML structure" (checks html, body attached)

**Recommendation:** Merge into single test:

```typescript
test("homepage loads with valid structure", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBeGreaterThanOrEqual(200);
  expect(response?.status()).toBeLessThan(400);
  await expect(page.locator("#root")).toBeVisible();
  await expect(page).toHaveTitle(/Awana Labs|Lovable App/);
});
```

---

### 2.2 Content Tests - **CONSOLIDATE**

**Duplicate Tests:**

- `basic.spec.ts:22` - "page has meaningful content" (checks length > 100, no errors)
- `live.spec.ts:46` - "site has meaningful content" (checks length > 100, not blank)

**Recommendation:** Merge or remove one - they're nearly identical.

---

### 2.3 Responsive Viewport Tests - **CONSOLIDATE**

**Duplicate Tests:**

- `basic.spec.ts:64` - "page is responsive (mobile viewport)"
- `basic.spec.ts:74` - "page is responsive (desktop viewport)"
- `live.spec.ts:133` - "site is responsive on mobile viewport"
- `live.spec.ts:147` - "site is responsive on desktop viewport"

**Recommendation:** Either remove all (low value) or create one parametrized test:

```typescript
test.describe("Responsive Design", () => {
  const viewports = [
    { name: "Mobile", width: 375, height: 667 },
    { name: "Desktop", width: 1920, height: 1080 },
  ];

  for (const vp of viewports) {
    test(`${vp.name} viewport loads content`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await expect(page.locator("body")).toBeVisible();
    });
  }
});
```

---

### 2.4 Performance Tests - **CONSOLIDATE**

**Duplicate Tests:**

- `basic.spec.ts:210` - "page loads within reasonable time" (< 10s)
- `live.spec.ts:58` - "site loads within reasonable time" (< 10s)

**Recommendation:** Keep only in one file, remove duplicate.

---

### 2.5 Projects Data Validation - **CONSOLIDATE**

**Duplicate Tests:**

- `projects.spec.ts:86` - "projects.json is fetched and contains correct data"
- `projects.spec.ts:151` - "projects.json has valid structure"
- `projects.spec.ts:173` - "GitHub Issue #2 data is correctly parsed"

**Recommendation:** Merge into single comprehensive data validation test.

---

### 2.6 Link Validation Tests - **CONSOLIDATE**

**Duplicate Tests:**

- `projects.spec.ts:214` - "repository links are valid"
- `projects.spec.ts:222` - "homepage and documentation links exist"

**Recommendation:** Merge into single "project links are valid" test.

---

## 3. Placeholder Test to Remove

### `src/test/example.test.ts` - **REMOVE**

**Content:** Single test `expect(true).toBe(true)` - a placeholder that provides no value.

**Recommendation:** Remove this file entirely. If this was meant as an example, it belongs in documentation, not the test suite.

---

## 4. Flaky Test Patterns Identified

### 4.1 Arbitrary Timeouts

**Problematic Pattern:** `await page.waitForTimeout(2000)`

**Locations:**

- `basic.spec.ts:51` - console errors test
- `basic.spec.ts:173` - projects.json data loads
- `projects.spec.ts:24, 43, 60, 76, 110, 125` - multiple project tests
- `verify-projects.spec.ts:9` - main verification test
- `live.spec.ts:114, 173` - errors and navigation tests

**Recommendation:** Replace with:

- `await page.waitForLoadState("networkidle")` for network requests
- `await page.waitForSelector(selector)` for specific elements
- `await expect(locator).toBeVisible()` for assertions

---

### 4.2 Conditional Test Logic

**Problematic Pattern:** Tests that pass regardless of outcome

**Locations:**

- `projects.spec.ts:121-143` - "if modal exists" test
- `live.spec.ts:168-178` - navigation test with "if no links, that's also fine"

**Recommendation:** Split into separate tests or remove non-deterministic branches.

---

### 4.3 Arbitrary Thresholds

**Problematic Pattern:** Tests that allow failures

**Locations:**

- `live.spec.ts:92` - allows < 10 failed asset requests
- `live.spec.ts:130` - allows < 5 critical JavaScript errors

**Recommendation:** Remove thresholds - tests should either pass or fail definitively.

---

## 5. Recommendations Summary

### High Priority Actions

1. **Delete** `e2e/verify-projects.spec.ts` - complete duplication
2. **Delete** `src/test/example.test.ts` - placeholder with no value
3. **Remove** "Time to First Contentful Paint" test - no assertions
4. **Remove** "projects.json data loads" test - no assertions

### Medium Priority Actions

5. **Consolidate** page load tests (4 tests → 1)
6. **Consolidate** responsive viewport tests (4 tests → 1 parametrized)
7. **Consolidate** projects data validation tests (3 tests → 1)
8. **Fix** arbitrary timeout usage - replace with proper waits

### Low Priority Actions

9. **Review** console errors test - rewrite with proper error event handling
10. **Decide** on flaky test thresholds - remove or make configurable

---

## 6. Test Coverage Matrix After Cleanup

| Category        | Before | After   | Reduction |
| --------------- | ------ | ------- | --------- |
| Page Load       | 4      | 1       | -75%      |
| Content         | 2      | 1       | -50%      |
| Responsive      | 4      | 1       | -75%      |
| Performance     | 2      | 1       | -50%      |
| Projects Data   | 4      | 1       | -75%      |
| Links           | 2      | 1       | -50%      |
| Flaky/Invalid   | 6      | 0       | -100%     |
| **Total Tests** | **45** | **~24** | **-47%**  |

---

## 7. Implementation Plan

### Phase 1: Removal (Low Risk)

1. Delete `e2e/verify-projects.spec.ts`
2. Delete `src/test/example.test.ts`
3. Remove non-asserting tests from `basic.spec.ts`

### Phase 2: Consolidation (Medium Risk)

1. Consolidate page load tests
2. Consolidate responsive viewport tests
3. Consolidate projects data validation

### Phase 3: Refactoring (High Value)

1. Replace arbitrary timeouts with proper waits
2. Remove conditional test logic
3. Add proper assertions to performance tests

---

## 8. Notes

- All E2E tests run against localhost:4173/awana-labs-showcase/ (preview server)
- `e2e-live/` tests run against deployed GitHub Pages site
- Consider whether both local and live testing are needed
- Some tests may be failing due to hardcoded URLs that don't match environment
