import eslint from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import testingLibrary from "eslint-plugin-testing-library";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  {
    ignores: [
      "dist",
      "storybook-static",
      "playwright-report",
      "test-results",
      "tests/e2e/**",
      ".storybook/**",
      "eslint.config.js",
      "vite.config.ts",
      "playwright.config.ts",
    ],
  },
  eslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [
      tseslint.configs.recommendedTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
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
    },
  },
  {
    files: ["src/**/*.test.{ts,tsx}"],
    ...testingLibrary.configs["flat/react"],
  },
);
