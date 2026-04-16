import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getProjectLoadErrorType, ApiError } from "./api";
import { GitHubApiError } from "./github";

function setOnlineStatus(value: boolean) {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    get: () => value,
  });
}

describe("getProjectLoadErrorType", () => {
  beforeEach(() => {
    setOnlineStatus(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 'offline' for ApiError with status 0", () => {
    const error = new ApiError("Failed to fetch", 0, "Offline");
    expect(getProjectLoadErrorType(error)).toBe("offline");
  });

  it("returns 'offline' when navigator is offline (regardless of error type)", () => {
    setOnlineStatus(false);
    const error = new Error("Network error");
    // isOnline() check comes before rate-limit/timeout checks
    expect(getProjectLoadErrorType(error)).toBe("offline");
  });

  it("returns 'timeout' for AbortError", () => {
    const error = new Error("The operation was aborted");
    error.name = "AbortError";
    expect(getProjectLoadErrorType(error)).toBe("timeout");
  });

  it("returns 'timeout' when 'timeout' appears in message", () => {
    const error = new Error("Request timeout");
    expect(getProjectLoadErrorType(error)).toBe("timeout");
  });

  it("returns 'timeout' for mixed-case 'Timeout' in message", () => {
    const error = new Error("Timeout exceeded");
    expect(getProjectLoadErrorType(error)).toBe("timeout");
  });

  it("returns 'rate-limit' for GitHubApiError with status 403 and 'rate limit' in message", () => {
    const error = new GitHubApiError("API rate limit exceeded", 403);
    expect(getProjectLoadErrorType(error)).toBe("rate-limit");
  });

  it("returns 'rate-limit' for duck-typed error with status 429 and 'rate limit'", () => {
    const error = { status: 429, message: "rate limit exceeded" };
    expect(getProjectLoadErrorType(error)).toBe("rate-limit");
  });

  it("returns 'generic' for a plain Error", () => {
    const error = new Error("Something went wrong");
    expect(getProjectLoadErrorType(error)).toBe("generic");
  });

  it("returns 'generic' for a string thrown as error", () => {
    expect(getProjectLoadErrorType("fail")).toBe("generic");
  });

  it("returns 'generic' for a number thrown as error", () => {
    expect(getProjectLoadErrorType(42)).toBe("generic");
  });

  it("returns 'generic' for null", () => {
    expect(getProjectLoadErrorType(null)).toBe("generic");
  });

  it("returns 'generic' for undefined", () => {
    expect(getProjectLoadErrorType(undefined)).toBe("generic");
  });
});
