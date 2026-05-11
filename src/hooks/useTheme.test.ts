import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTheme } from "@/hooks/useTheme";

// Mock localStorage with a plain object store
let store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key];
  }),
  clear: vi.fn(() => {
    store = {};
  }),
  get length() {
    return Object.keys(store).length;
  },
  key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
};

// Mock matchMedia
let prefersDark = false;
const mediaListeners = new Set<() => void>();
const matchMediaMock = vi.fn((query: string) => {
  if (query === "(prefers-color-scheme: dark)") {
    return {
      matches: prefersDark,
      addEventListener: vi.fn((event: string, cb: () => void) => {
        if (event === "change") mediaListeners.add(cb);
      }),
      removeEventListener: vi.fn((event: string, cb: () => void) => {
        if (event === "change") mediaListeners.delete(cb);
      }),
    };
  }
  return {
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
});

describe("useTheme", () => {
  let classListToggleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    store = {};
    localStorageMock.getItem.mockImplementation(
      (key: string) => store[key] ?? null,
    );
    localStorageMock.setItem.mockImplementation(
      (key: string, value: string) => {
        store[key] = value;
      },
    );
    prefersDark = false;
    mediaListeners.clear();

    vi.stubGlobal("localStorage", localStorageMock);
    vi.stubGlobal("matchMedia", matchMediaMock);

    classListToggleSpy = vi.spyOn(document.documentElement.classList, "toggle");

    // Reset theme module state — clear localStorage directly
    delete store["awana-labs-theme"];
  });

  afterEach(() => {
    classListToggleSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it("returns 'system' theme and 'light' resolved when no localStorage and prefersDark is false", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("system");
    expect(result.current.resolvedTheme).toBe("light");
  });

  it("reads stored theme from localStorage on init", () => {
    store["awana-labs-theme"] = "dark";
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("dark");
    expect(result.current.resolvedTheme).toBe("dark");
  });

  it("setTheme('dark') persists to localStorage and adds dark class", () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.setTheme("dark");
    });
    expect(store["awana-labs-theme"]).toBe("dark");
    expect(classListToggleSpy).toHaveBeenCalledWith("dark", true);
  });

  it("setTheme('light') removes dark class", () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.setTheme("light");
    });
    expect(store["awana-labs-theme"]).toBe("light");
    expect(classListToggleSpy).toHaveBeenCalledWith("dark", false);
  });

  it("setTheme('system') follows prefers-color-scheme", () => {
    prefersDark = true;
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.setTheme("system");
    });
    expect(store["awana-labs-theme"]).toBe("system");
    // applyTheme checks matchMedia, which returns prefersDark=true
    expect(classListToggleSpy).toHaveBeenCalledWith("dark", true);
  });

  it("changing matchMedia.matches fires listener and re-renders when theme is 'system'", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.resolvedTheme).toBe("light");

    // Simulate OS preference change to dark
    prefersDark = true;
    act(() => {
      mediaListeners.forEach((fn) => fn());
    });

    expect(result.current.resolvedTheme).toBe("dark");
  });

  it("subscription is removed on unmount (removeEventListener called)", () => {
    const removeSpy = vi.fn();

    // Override matchMedia to track removal
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => {
        if (query === "(prefers-color-scheme: dark)") {
          return {
            matches: prefersDark,
            addEventListener: vi.fn(),
            removeEventListener: removeSpy,
          };
        }
        return {
          matches: false,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        };
      }),
    );

    const { unmount } = renderHook(() => useTheme());
    unmount();
    expect(removeSpy).toHaveBeenCalled();
  });

  it("localStorage read failure falls back to 'system'", () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error("Storage blocked");
    });
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("system");
  });
});
