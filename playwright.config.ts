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
 * The webServer array auto-starts the env servers before tests and tears
 * them down afterwards. Servers are reused if already running.
 * TEST_ENVS (e.g. "stable" or "stable,int") limits which servers start;
 * CI sets it to the env under test. Default: all three.
 */
const PORTS = { stable: 3001, release: 3002, int: 3003 };
const testEnvs = (process.env.TEST_ENVS || Object.keys(PORTS).join(","))
  .split(",")
  .map((env) => env.trim()) as (keyof typeof PORTS)[];

export default defineConfig({
  testDir: "./tests/specs",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  // The app runs locally and responds in milliseconds: a missing element
  // should fail fast instead of waiting out Playwright's 30s default.
  timeout: 15_000,
  expect: { timeout: 5_000 },
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
    actionTimeout: 5_000,
    navigationTimeout: 10_000,
  },
  webServer: testEnvs.map((env) => ({
    command: `ENV_NAME=${env} ts-node --transpile-only app/server.ts`,
    url: `http://localhost:${PORTS[env]}/api/env`,
    reuseExistingServer: !process.env.CI,
    timeout: 10_000,
  })),
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
