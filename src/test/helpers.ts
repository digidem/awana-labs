/**
 * Shared test helpers for unit tests
 *
 * Utility functions that are reused across multiple test files.
 */

/**
 * Override `navigator.onLine` for testing offline/online behavior.
 *
 * @example
 * setOnlineStatus(false); // simulate offline
 * setOnlineStatus(true);  // simulate online
 */
export function setOnlineStatus(value: boolean) {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    get: () => value,
  });
}
