/**
 * Service Worker: Image Cache
 *
 * Minimal cache-first service worker for external project images.
 * First visit pays the full network cost; repeat visits and revisits
 * get near-instant loads from the Cache API.
 *
 * Scope: only intercepts requests where `request.destination === "image"`.
 * All other requests pass through untouched.
 */

const CACHE_NAME = "awana-labs-images-v1";
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_ENTRIES = 200;

// ---------------------------------------------------------------------------
// Install — activate immediately without waiting for existing clients to close
// ---------------------------------------------------------------------------
self.addEventListener("install", () => {
  self.skipWaiting();
});

// ---------------------------------------------------------------------------
// Activate — claim all clients and purge old caches
// ---------------------------------------------------------------------------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      ),
    ).then(() => self.clients.claim()),
  );
});

// ---------------------------------------------------------------------------
// Fetch — cache-first for images, network-only for everything else
// ---------------------------------------------------------------------------
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only cache image requests
  if (request.destination !== "image") return;

  // Only cache GET requests
  if (request.method !== "GET") return;

  event.respondWith(imageCacheFirst(request));
});

/**
 * Cache-first strategy with TTL and entry limit.
 */
async function imageCacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    // Check TTL
    const dateHeader = cached.headers.get("sw-cache-time");
    if (dateHeader) {
      const age = Date.now() - parseInt(dateHeader, 10);
      if (age < MAX_AGE_MS) {
        return cached;
      }
    } else {
      // No TTL header — serve from cache (backward compat)
      return cached;
    }
  }

  // Fetch from network
  try {
    const response = await fetch(request);

    // Only cache successful responses
    if (response.ok) {
      const headers = new Headers(response.headers);
      headers.set("sw-cache-time", String(Date.now()));

      const body = response.body;
      const cachedResponse = new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });

      // Store in cache (fire-and-forget)
      cache.put(request, cachedResponse.clone());

      // Prune excess entries in the background
      pruneCache(cache);

      return cachedResponse;
    }

    return response;
  } catch {
    // Network failed — return stale cache if available, else offline response
    if (cached) return cached;
    return new Response("", { status: 503, statusText: "Service Unavailable" });
  }
}

/**
 * Remove oldest entries when cache exceeds MAX_ENTRIES.
 */
async function pruneCache(cache) {
  const keys = await cache.keys();
  if (keys.length <= MAX_ENTRIES) return;

  // Check timestamps and remove oldest
  const entries = await Promise.all(
    keys.map(async (key) => {
      const response = await cache.match(key);
      const time = response?.headers.get("sw-cache-time") || "0";
      return { key, time: parseInt(time, 10) };
    }),
  );

  entries.sort((a, b) => a.time - b.time);

  const toDelete = entries.slice(0, entries.length - MAX_ENTRIES);
  await Promise.all(toDelete.map((entry) => cache.delete(entry.key)));
}
