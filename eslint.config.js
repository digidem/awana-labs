import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "test-results",
      "test-results/**",
      ".ralphy-worktrees/**",
      ".ralphy-sandboxes/**",
      ".claude/**",
      ".claude-flow/**",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      // Allow reasonable deviations
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-require-imports": "off",
      // Allow setState in effect for synchronization purposes
      "react-hooks/set-state-in-effect": "off",
      // Allow impure functions in render for skeleton loading (shadcn/ui pattern)
      "react-hooks/purity": "off",
    },
  },
  // E2E tests can use any types for Playwright
  {
    files: ["e2e/**/*.ts", "e2e-live/**/*.ts", "playwright.config.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
