import { describe, it, expect } from "vitest";
import packageJson from "../../package.json";

describe("Package Metadata", () => {
  it("should have correct package name", () => {
    expect(packageJson.name).toBe("awana-labs-showcase");
  });

  it("should have production version", () => {
    expect(packageJson.version).toBe("1.0.0");
    expect(packageJson.version).not.toBe("0.0.0");
  });

  it("should be marked as private", () => {
    expect(packageJson.private).toBe(true);
  });

  it("should use ES modules", () => {
    expect(packageJson.type).toBe("module");
  });

  it("should have required scripts", () => {
    expect(packageJson.scripts).toHaveProperty("dev");
    expect(packageJson.scripts).toHaveProperty("build");
    expect(packageJson.scripts).toHaveProperty("test");
    expect(packageJson.scripts).toHaveProperty("test:e2e");
    expect(packageJson.scripts).toHaveProperty("lint");
    expect(packageJson.scripts).toHaveProperty("typecheck");
  });
});
