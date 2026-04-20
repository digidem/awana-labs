import { describe, it, expect } from "vitest";
import {
  statusColors,
  usageTranslationKeys,
  getStatusClasses,
  getUsageLabel,
} from "@/lib/status-utils";

describe("statusColors", () => {
  it("has entries for all three states", () => {
    expect(statusColors).toHaveProperty("active");
    expect(statusColors).toHaveProperty("paused");
    expect(statusColors).toHaveProperty("archived");
  });

  it("active uses primary color token classes", () => {
    expect(statusColors.active).toContain("primary");
  });

  it("paused uses secondary color token classes", () => {
    expect(statusColors.paused).toContain("secondary");
  });

  it("archived includes muted classes", () => {
    expect(statusColors.archived).toContain("muted");
  });
});

describe("usageTranslationKeys", () => {
  it("has entries for all three usage levels", () => {
    expect(usageTranslationKeys).toHaveProperty("experimental");
    expect(usageTranslationKeys).toHaveProperty("used");
    expect(usageTranslationKeys).toHaveProperty("widely-used");
  });

  it("values are correct i18n keys", () => {
    expect(usageTranslationKeys.experimental).toBe("status.experimental");
    expect(usageTranslationKeys.used).toBe("status.used");
    expect(usageTranslationKeys["widely-used"]).toBe("status.widelyUsed");
  });
});

describe("getStatusClasses", () => {
  it("returns correct classes for each state", () => {
    expect(getStatusClasses("active")).toBeTypeOf("string");
    expect(getStatusClasses("paused")).toBeTypeOf("string");
    expect(getStatusClasses("archived")).toBeTypeOf("string");
  });

  it("returns same value as statusColors[state]", () => {
    expect(getStatusClasses("active")).toBe(statusColors.active);
    expect(getStatusClasses("paused")).toBe(statusColors.paused);
    expect(getStatusClasses("archived")).toBe(statusColors.archived);
  });
});

describe("getUsageLabel", () => {
  it("calls t function with correct key for each usage level", () => {
    const t = (key: string) => `[${key}]`;

    expect(getUsageLabel("experimental", t)).toBe("[status.experimental]");
    expect(getUsageLabel("used", t)).toBe("[status.used]");
    expect(getUsageLabel("widely-used", t)).toBe("[status.widelyUsed]");
  });

  it("passes through the translation result", () => {
    const t = (key: string) => `translated:${key}`;

    expect(getUsageLabel("experimental", t)).toBe(
      "translated:status.experimental",
    );
    expect(getUsageLabel("used", t)).toBe("translated:status.used");
    expect(getUsageLabel("widely-used", t)).toBe(
      "translated:status.widelyUsed",
    );
  });
});
