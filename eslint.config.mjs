import { defineConfig } from "eslint/config";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import playwright from "eslint-plugin-playwright";

export default defineConfig(
  {
    ignores: [
      "node_modules",
      "dist",
      "playwright-report",
      "test-results",
      "allure-results",
      "allure-report",
      "reports",
    ],
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    // Catches the flaky patterns this suite avoids: fixed sleeps,
    // waitForSelector, non-retrying assertions, focused tests.
    files: ["tests/**/*.ts"],
    extends: [playwright.configs["flat/recommended"]],
  },
);
