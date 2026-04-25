import { useCallback, useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "awana-labs-theme";

const listeners = new Set<() => void>();

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getThemeSnapshot(): Theme {
  try {
    return (localStorage.getItem(STORAGE_KEY) as Theme) || "system";
  } catch {
    return "system";
  }
}

function getServerSnapshot(): Theme {
  return "system";
}

function subscribeSystemPreference(callback: () => void): () => void {
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSystemPreferenceSnapshot(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getSystemPreferenceServerSnapshot(): "light" | "dark" {
  return "light";
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  root.classList.toggle("dark", isDark);
}

/**
 * Hook for managing light/dark/system theme preference.
 *
 * - Reads stored preference from localStorage on init
 * - Falls back to system `prefers-color-scheme` when set to "system"
 * - Persists changes to localStorage and updates `<html>` class
 */
export function useTheme(): {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
} {
  const theme = useSyncExternalStore(
    subscribe,
    getThemeSnapshot,
    getServerSnapshot,
  );
  const systemPreference = useSyncExternalStore(
    subscribeSystemPreference,
    getSystemPreferenceSnapshot,
    getSystemPreferenceServerSnapshot,
  );

  const setTheme = useCallback((next: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (e) {
      console.warn("Failed to write theme to localStorage:", e);
    }
    applyTheme(next);
    listeners.forEach((fn) => fn());
  }, []);

  const resolvedTheme: "light" | "dark" =
    theme === "system" ? systemPreference : theme;

  // Re-apply on mount and whenever the resolved theme changes
  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  }, [resolvedTheme]);

  return { theme, setTheme, resolvedTheme };
}
