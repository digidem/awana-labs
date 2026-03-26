import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, statSync } from "fs";
import { join } from "path";
import packageJson from "../../package.json";

describe("Husky Setup", () => {
  const projectRoot = join(__dirname, "../..");
  const huskyDir = join(projectRoot, ".husky");

  it("should have husky installed as a dev dependency", () => {
    expect(packageJson.devDependencies).toHaveProperty("husky");
    expect(packageJson.devDependencies.husky).toMatch(/^\^?\d+\.\d+\.\d+$/);
  });

  it("should have prepare script configured to run husky", () => {
    expect(packageJson.scripts).toHaveProperty("prepare");
    expect(packageJson.scripts.prepare).toBe("husky");
  });

  it("should have .husky directory", () => {
    expect(existsSync(huskyDir)).toBe(true);
    const stats = statSync(huskyDir);
    expect(stats.isDirectory()).toBe(true);
  });

  it("should have pre-commit hook file", () => {
    const preCommitPath = join(huskyDir, "pre-commit");
    expect(existsSync(preCommitPath)).toBe(true);

    // Check if file is executable
    const stats = statSync(preCommitPath);
    const isExecutable = (stats.mode & 0o111) !== 0;
    expect(isExecutable).toBe(true);
  });

  it("should have pre-push hook file", () => {
    const prePushPath = join(huskyDir, "pre-push");
    expect(existsSync(prePushPath)).toBe(true);

    // Check if file is executable
    const stats = statSync(prePushPath);
    const isExecutable = (stats.mode & 0o111) !== 0;
    expect(isExecutable).toBe(true);
  });

  it("should keep Husky hook files aligned with the repository contract", () => {
    const preCommitPath = join(huskyDir, "pre-commit");
    const prePushPath = join(huskyDir, "pre-push");
    const preCommitContent = readFileSync(preCommitPath, "utf-8").trim();
    const prePushContent = readFileSync(prePushPath, "utf-8").trim();

    expect(preCommitContent).toBe("npx lint-staged");
    expect(prePushContent).toBe("npm run typecheck");
  });

  it("pre-commit hook should contain lint-staged command", () => {
    const preCommitPath = join(huskyDir, "pre-commit");
    const content = readFileSync(preCommitPath, "utf-8");
    expect(content).toContain("lint-staged");
  });

  it("pre-push hook should contain typecheck command", () => {
    const prePushPath = join(huskyDir, "pre-push");
    const content = readFileSync(prePushPath, "utf-8");
    expect(content).toContain("npm run typecheck");
  });

  it("should use Husky v9+ modern syntax", () => {
    const huskyVersion = packageJson.devDependencies.husky;
    // Remove the caret (^) prefix if present
    const cleanVersion = huskyVersion.replace(/^\^/, "");
    const majorVersion = parseInt(cleanVersion.split(".")[0]);

    expect(majorVersion).toBeGreaterThanOrEqual(9);

    // Husky v9+ uses "husky" instead of "husky install"
    expect(packageJson.scripts.prepare).toBe("husky");
  });
});
