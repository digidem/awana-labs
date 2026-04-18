import { useEffect, useRef } from "react";

type ScrollCallback = (scrollY: number) => void;

// Module-level shared state: one listener for all consumers
const listeners = new Set<ScrollCallback>();
let rafId: number | null = null;
let currentScrollY =
  typeof window !== "undefined" ? window.scrollY : 0;
let listenerCount = 0;

function scheduleUpdate() {
  if (rafId !== null) return;
  rafId = requestAnimationFrame(() => {
    currentScrollY = window.scrollY;
    rafId = null;
    for (const cb of listeners) {
      cb(currentScrollY);
    }
  });
}

function onScroll() {
  scheduleUpdate();
}

function subscribe(cb: ScrollCallback): () => void {
  if (listeners.size === 0) {
    window.addEventListener("scroll", onScroll, { passive: true });
  }
  listeners.add(cb);
  listenerCount++;
  // Immediately call with current value
  cb(currentScrollY);
  return () => {
    listeners.delete(cb);
    listenerCount--;
    if (listeners.size === 0) {
      window.removeEventListener("scroll", onScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }
  };
}

/**
 * Subscribe to RAF-throttled scroll position updates.
 *
 * The callback receives the current `window.scrollY` on every animation frame
 * where a scroll event occurred. A single module-level scroll listener is shared
 * across all consumers — no matter how many components use this hook, only one
 * `addEventListener("scroll", ...)` is active.
 *
 * The callback is invoked imperatively (not via React state), so it's safe to
 * use for direct DOM mutations without triggering re-renders.
 */
export function useScrollListener(callback: ScrollCallback): void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    const unsubscribe = subscribe((y) => callbackRef.current(y));
    return unsubscribe;
  }, []);
}
