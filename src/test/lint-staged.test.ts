import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

describe("lint-staged configuration", () => {
  const rootDir = join(__dirname, "../..");
  const packageJsonPath = join(rootDir, "package.json");
  const huskyPreCommitPath = join(rootDir, ".husky/pre-commit");

  it("should have lint-staged installed as dev dependency", () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

    expect(packageJson.devDependencies).toBeDefined();
    expect(packageJson.devDependencies["lint-staged"]).toBeDefined();
    expect(packageJson.devDependencies["lint-staged"]).toMatch(
      /^\^?\d+\.\d+\.\d+$/,
    );
  });

  it("should have lint-staged configuration in package.json", () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

    expect(packageJson["lint-staged"]).toBeDefined();
    expect(typeof packageJson["lint-staged"]).toBe("object");
  });

  it("should configure ESLint for JavaScript/TypeScript files", () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    const lintStagedConfig = packageJson["lint-staged"];

    // Check for file patterns that include JS/TS files
    const jsPattern = Object.keys(lintStagedConfig).find(
      (pattern) =>
        pattern.includes("js") ||
        pattern.includes("jsx") ||
        pattern.includes("ts") ||
        pattern.includes("tsx"),
    );

    expect(jsPattern).toBeDefined();
    expect(Array.isArray(lintStagedConfig[jsPattern!])).toBe(true);

    // Check for ESLint command
    const hasEslint = lintStagedConfig[jsPattern!].some((cmd: string) =>
      cmd.includes("eslint"),
    );
    expect(hasEslint).toBe(true);
  });

  it("should configure TypeScript type checking for TS files", () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    const lintStagedConfig = packageJson["lint-staged"];

    // Check for TypeScript-specific pattern (may be combined with JS)
    const tsPattern = Object.keys(lintStagedConfig).find(
      (pattern) => pattern.includes("ts"),
    );

    expect(tsPattern).toBeDefined();
    expect(Array.isArray(lintStagedConfig[tsPattern!])).toBe(true);
  });

  it("should have Husky pre-commit hook configured", () => {
    expect(existsSync(huskyPreCommitPath)).toBe(true);
  });

  it("should use lint-staged in pre-commit hook", () => {
    const preCommitContent = readFileSync(huskyPreCommitPath, "utf-8");

    expect(preCommitContent).toContain("lint-staged");
  });

  it("should not run full project lint in pre-commit hook", () => {
    const preCommitContent = readFileSync(huskyPreCommitPath, "utf-8");

    // Should not have "npm run lint" anymore since we're using lint-staged
    const lines = preCommitContent.split("\n").filter((line) => line.trim());
    const hasNpmRunLint = lines.some(
      (line) => line.includes("npm run lint") && !line.includes("lint-staged"),
    );

    expect(hasNpmRunLint).toBe(false);
  });

  it("should have proper ESLint fix flag in lint-staged config", () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    const lintStagedConfig = packageJson["lint-staged"];

    const jsPattern = Object.keys(lintStagedConfig).find(
      (pattern) => pattern.includes("js") || pattern.includes("ts"),
    );

    expect(jsPattern).toBeDefined();

    const eslintCmd = lintStagedConfig[jsPattern!].find((cmd: string) =>
      cmd.includes("eslint"),
    );

    expect(eslintCmd).toBeDefined();
    expect(eslintCmd).toContain("--fix");
  });

  it("should have TypeScript check with proper flags", () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    const lintStagedConfig = packageJson["lint-staged"];

    const tsPattern = Object.keys(lintStagedConfig).find(
      (pattern) => pattern.includes("ts") && !pattern.includes("js"),
    );

    if (tsPattern) {
      const tscCmd = lintStagedConfig[tsPattern].find((cmd: string) =>
        cmd.includes("tsc"),
      );

      if (tscCmd) {
        expect(tscCmd).toContain("--noEmit");
      }
    }
  });
});
