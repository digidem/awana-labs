import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Husky TypeCheck Integration", () => {
  const projectRoot = path.resolve(__dirname, "../..");

  describe("package.json configuration", () => {
    it("should have typecheck script defined", () => {
      const packageJsonPath = path.join(projectRoot, "package.json");
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

      expect(packageJson.scripts).toHaveProperty("typecheck");
      expect(packageJson.scripts.typecheck).toBe("tsc --noEmit");
    });

    it("should have lint-staged configuration for TypeScript files", () => {
      const packageJsonPath = path.join(projectRoot, "package.json");
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

      expect(packageJson["lint-staged"]).toBeDefined();

      // Find TypeScript pattern dynamically (may be combined with JS)
      const tsPattern = Object.keys(packageJson["lint-staged"]).find((p) =>
        p.includes("ts"),
      );
      expect(tsPattern).toBeDefined();

      const tsConfig = packageJson["lint-staged"][tsPattern];
      expect(Array.isArray(tsConfig)).toBe(true);
      expect(tsConfig.every((cmd: string) => typeof cmd === "string")).toBe(
        true,
      );
    });
  });

  describe("Husky hooks", () => {
    it("should have pre-commit hook file", () => {
      const preCommitPath = path.join(projectRoot, ".husky", "pre-commit");
      expect(fs.existsSync(preCommitPath)).toBe(true);

      const content = fs.readFileSync(preCommitPath, "utf8");
      expect(content).toContain("lint-staged");
    });

    it("should have pre-push hook file", () => {
      const prePushPath = path.join(projectRoot, ".husky", "pre-push");
      expect(fs.existsSync(prePushPath)).toBe(true);

      const content = fs.readFileSync(prePushPath, "utf8");
      expect(content).toContain("typecheck");
    });

    it("should have executable permissions on hook files", () => {
      const preCommitPath = path.join(projectRoot, ".husky", "pre-commit");
      const prePushPath = path.join(projectRoot, ".husky", "pre-push");

      // Check if files are executable (on Unix-like systems)
      if (process.platform !== "win32") {
        const preCommitStats = fs.statSync(preCommitPath);
        const prePushStats = fs.statSync(prePushPath);

        // Check for execute permission (mode & 0o111)
        expect(preCommitStats.mode & 0o111).toBeGreaterThan(0);
        expect(prePushStats.mode & 0o111).toBeGreaterThan(0);
      }
    });
  });

  describe("TypeScript configuration", () => {
    it("should have tsconfig.json with appropriate settings", () => {
      const tsconfigPath = path.join(projectRoot, "tsconfig.json");
      expect(fs.existsSync(tsconfigPath)).toBe(true);

      // Read and strip comments from JSONC
      const tsconfigContent = fs.readFileSync(tsconfigPath, "utf8");
      const tsconfigWithoutComments = tsconfigContent
        .split("\n")
        .filter((line) => !line.trim().startsWith("//"))
        .map((line) => line.replace(/\/\*.*?\*\//g, ""))
        .join("\n");

      const tsconfig = JSON.parse(tsconfigWithoutComments);

      // Verify noEmit is set (or not explicitly set to false)
      expect(tsconfig.compilerOptions.noEmit !== false).toBe(true);
    });
  });

  describe("integration validation", () => {
    it("should keep the typecheck script configured for the pre-push hook", () => {
      const packageJsonPath = path.join(projectRoot, "package.json");
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      const prePushPath = path.join(projectRoot, ".husky", "pre-push");

      expect(packageJson.scripts.typecheck).toBe("tsc --noEmit");

      const prePushContent = fs.readFileSync(prePushPath, "utf8");
      expect(prePushContent).toContain("npm run typecheck");
    });
  });
});
