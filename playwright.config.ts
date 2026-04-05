import { defineConfig, devices } from "@playwright/test";
import path from "path";

const authDir = path.resolve(__dirname, "tests", ".auth");

/**
 * Multi-environment Playwright configuration.
 *
 * Each project targets a different environment (stable, release, int)
 * with its own baseURL and custom metadata used by page objects
 * to resolve selectors and interaction patterns.
 *
 * Auth setup projects run first (once per env), log in, and save
 * localStorage to .auth/{env}.json. Test projects reuse that state.
 *
 * The webServer array auto-starts all three env servers before tests
 * and tears them down afterwards. Servers are reused if already running.
 */
export default defineConfig({
  testDir: "./tests/specs",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ["html", { open: "never" }],
    ["list"],
    [
      "allure-playwright",
      {
        resultsDir: "allure-results",
        environmentInfo: {
          NODE_VERSION: process.version,
        },
      },
    ],
  ],
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "ENV_NAME=stable ts-node app/server.ts",
      url: "http://localhost:3001/api/env",
      reuseExistingServer: !process.env.CI,
      timeout: 10_000,
    },
    {
      command: "ENV_NAME=release ts-node app/server.ts",
      url: "http://localhost:3002/api/env",
      reuseExistingServer: !process.env.CI,
      timeout: 10_000,
    },
    {
      command: "ENV_NAME=int ts-node app/server.ts",
      url: "http://localhost:3003/api/env",
      reuseExistingServer: !process.env.CI,
      timeout: 10_000,
    },
  ],
  projects: [
    // ── Auth setup projects (run first) ──────────────
    {
      name: "setup-stable",
      testMatch: /auth\.setup\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3001",
      },
    },
    {
      name: "setup-release",
      testMatch: /auth\.setup\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3002",
      },
    },
    {
      name: "setup-int",
      testMatch: /auth\.setup\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3003",
      },
    },

    // ── Test projects (depend on their setup) ────────
    {
      name: "stable",
      dependencies: ["setup-stable"],
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3001",
        storageState: path.join(authDir, "stable.json"),
      },
      metadata: { envName: "stable" },
      grep: [/@stable/, /@all/],
    },
    {
      name: "release",
      dependencies: ["setup-release"],
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3002",
        storageState: path.join(authDir, "release.json"),
      },
      metadata: { envName: "release" },
      grep: [/@release/, /@all/],
    },
    {
      name: "int",
      dependencies: ["setup-int"],
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3003",
        storageState: path.join(authDir, "int.json"),
      },
      metadata: { envName: "int" },
      grep: [/@int/, /@all/],
    },
  ],
});
