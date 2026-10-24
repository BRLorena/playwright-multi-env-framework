import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";
import { selectedEnvironments } from "./config/environments";
import type { TodoWorkerOptions } from "./tests/fixtures/todo.fixture";

/**
 * Multi-environment Playwright configuration.
 *
 * One project per environment (stable, release, int), generated from
 * config/environments.ts. Each project passes its envName to the
 * fixtures, which pick the env's selectors and interaction patterns.
 *
 * Auth: every worker logs in once through the UI and reuses that
 * storageState for all its tests (see tests/fixtures/todo.fixture.ts).
 * The app keeps one todo list per session, so workers are isolated and
 * tests run fully in parallel.
 *
 * Local environments are started by webServer and torn down afterwards
 * (reused if already running). An env with {ENV}_BASE_URL set runs
 * against that URL instead. TEST_ENVS limits the run to some envs.
 */
const environments = selectedEnvironments();

export default defineConfig<object, TodoWorkerOptions>({
  testDir: "./tests/specs",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // GitHub-hosted runners have 4 vCPUs; locally Playwright uses half the cores
  workers: process.env.CI ? 4 : undefined,
  // The app responds in milliseconds: a missing element should fail fast
  // instead of waiting out Playwright's 30s default.
  timeout: 15_000,
  expect: { timeout: 5_000 },
  reporter: [
    ["html", { open: "never" }],
    ["list"],
    ["json", { outputFile: "reports/results.json" }],
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
  webServer: environments
    .filter((env) => env.local)
    .map((env) => ({
      command: `ENV_NAME=${env.name} ts-node --transpile-only app/server.ts`,
      url: `${env.baseURL}/api/env`,
      reuseExistingServer: !process.env.CI,
      timeout: 10_000,
    })),
  projects: environments.map((env) => ({
    name: env.name,
    use: {
      ...devices["Desktop Chrome"],
      baseURL: env.baseURL,
      envName: env.name,
    },
    // @all tests run everywhere; @stable/@release/@int only on that env
    grep: [new RegExp(`@${env.name}\\b`), /@all\b/],
  })),
});
