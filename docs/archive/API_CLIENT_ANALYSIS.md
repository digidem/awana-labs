# API Client/Fetch Helper Analysis and Proposed Changes

## Analysis Summary

### 1. Typing Issues Found

#### Before

- **src/pages/Index.tsx**: Raw `fetch()` call with manual type casting
  ```typescript
  const data: ProjectsData = await response.json();
  ```

  - No validation that response is actually ProjectsData
  - No content-type validation
  - Type assertion without runtime checks

#### After

- **src/lib/api.ts**: Fully typed API client with generic types
  ```typescript
  export async function fetchJson<T>(
    url: string,
    options: FetchOptions = {},
  ): Promise<ApiResponse<T>>;
  ```

  - Generic `ApiResponse<T>` wrapper with full type safety
  - Content-type validation before JSON parsing
  - Custom `ApiError` class with status codes and context

### 2. Caching Issues Found

#### Before

- **No caching**: Each page load triggered a new network request
- **No retry logic**: Single failed request meant complete failure
- **No stale data handling**: No background refresh or cache invalidation

#### After

- **TanStack Query integration**: Built-in caching with configurable TTL
  - `staleTime: 5 minutes` - Data considered fresh for 5 minutes
  - `gcTime: 10 minutes` - Cache kept in memory for 10 minutes
  - `retry: 2` - Automatic retry on failure
- **Query key management**: Centralized in `queryKeys` object
- **Custom hooks**: `useProjects()` and `useProjectsWithError()` for React components

### 3. Separation of Concerns (SoC) Issues Found

#### Before

- **src/pages/Index.tsx**: Component handled data fetching logic
  ```typescript
  useEffect(() => {
    const fetchProjects = async () => {
      const response = await fetch(`${import.meta.env.BASE_URL}projects.json`);
      const data: ProjectsData = await response.json();
      setProjects(data.projects);
    };
    fetchProjects();
  }, []);
  ```

  - Business logic mixed with UI rendering
  - No reusability across components
  - Error handling inline with component code

#### After

- **Three-layer architecture**:
  1. `src/lib/api.ts` - Core API client (fetch, retry, error handling)
  2. `src/hooks/useProjects.ts` - React hooks (state management, caching)
  3. `src/pages/Index.tsx` - UI layer only

## New Files Created

### src/lib/api.ts

Centralized API client with:

- Generic typed fetch functions (`fetchJson<T>`, `fetchText`)
- Timeout and retry logic
- Custom `ApiError` class
- Content-type validation
- TanStack Query integration helpers

### src/hooks/useProjects.ts

React hooks for project data:

- `useProjects(options)` - Full TanStack Query integration
- `useProjectsWithError(options)` - Simplified error handling
- Configurable options (staleTime, retry, etc.)

### src/lib/api.test.ts

Unit tests for API client:

- JSON fetch with type safety
- Error handling (4xx, 5xx, network errors)
- Content-type validation
- ApiError class behavior

### src/hooks/useProjects.test.tsx

React hook tests:

- Success scenarios
- Error scenarios
- Loading states
- Configuration options

## Files Modified

### src/pages/Index.tsx

**Before**: 47 lines with inline fetch logic
**After**: 29 lines, only UI logic

**Changes**:

- Removed `useState`, `useEffect`, manual fetch
- Added `useProjectsWithError` hook
- Added proper error UI state

### src/App.tsx

**Changes**:

- Added QueryClient configuration with sensible defaults
- Configured global cache and retry behavior

## Benefits

1. **Type Safety**: Full TypeScript coverage from fetch to UI
2. **Reusability**: `fetchJson<T>` can be used for any API endpoint
3. **Testability**: Pure functions, easy to mock in tests
4. **Performance**: Built-in caching reduces unnecessary network requests
5. **Error Handling**: Centralized, consistent error handling
6. **Developer Experience**: Clear separation of concerns

## Testing

All tests passing:

- 9 API client tests (fetch, errors, validation)
- 5 React hook tests (success, error, loading states)
- 1 existing example test

Total: 15 tests passing

## Migration Path

For other API endpoints in the future:

1. Add typed fetch function to `src/lib/api.ts`:

   ```typescript
   export async function fetchSomething(
     id: string,
   ): Promise<ApiResponse<Something>> {
     return fetchJson<Something>(`/api/something/${id}`);
   }
   ```

2. Create React hook in `src/hooks/`:

   ```typescript
   export function useSomething(id: string) {
     return useQuery({
       queryKey: ["something", id],
       queryFn: () => fetchSomething(id),
     });
   }
   ```

3. Use in component:
   ```typescript
   const { data, isLoading, error } = useSomething(id);
   ```
