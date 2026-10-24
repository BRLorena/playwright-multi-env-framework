# playwright-multi-env-framework

[![Playwright Multi-Environment Tests](https://github.com/BRLorena/playwright-multi-env-framework/actions/workflows/test.yml/badge.svg)](https://github.com/BRLorena/playwright-multi-env-framework/actions/workflows/test.yml)
[![Allure Report](https://img.shields.io/badge/Allure-Report-yellow)](https://brlorena.github.io/playwright-multi-env-framework/)

> A production-grade Playwright test framework for a multi-environment web app — demonstrating how QA automation scales across stable, release, and integration environments with auth, CI/CD, and branch-scoped test execution.

**📊 [Live Allure report](https://brlorena.github.io/playwright-multi-env-framework/)**: all three environments, refreshed daily from `main`, with history and trends.

---

## Why this project exists

Most QA portfolios show tests against a single URL. Real products have multiple environments — each with different selectors, interaction patterns, feature flags, and credentials. This project was built to demonstrate exactly that:

- How to architect a test framework that handles **env-specific UI differences** without duplicating tests
- How to manage **per-environment authentication** with Playwright's `storageState`
- How to wire **branch-aware CI pipelines** that run only the relevant environment's tests
- How to **block merges** when the stable environment's tests fail

---

## Architecture

```
app/                        Express server (serves 3 env variants)
  routes/
    auth.ts                 Login API + requireAuth middleware
    todos.ts                CRUD API
  public/
    index-{stable,release,int}.html   Different UI per env
    login-{stable,release,int}.html   Login pages per env

tests/
  specs/
    auth.setup.ts           Logs in once per env, saves storageState
    crud.spec.ts            Core CRUD tests — run on ALL envs (@all)
    ui-variant.spec.ts      Env-specific UI tests (@stable/@release/@int)
  pages/
    todo.page.ts            Page Object Model, env-aware
  helpers/
    selectors.ts            Per-env selector map (the key abstraction)
  fixtures/
    todo.fixture.ts         Custom fixture wiring TodoPage + clean state
  .auth/                    Saved auth state per env (gitignored)
```

### Environment matrix

| Environment | Port | UI style             | Edit pattern | Selectors     |
| ----------- | ---- | -------------------- | ------------ | ------------- |
| **stable**  | 3001 | Classic list         | Inline edit  | `id`-based    |
| **release** | 3002 | Card grid            | Modal        | `class`-based |
| **int**     | 3003 | Dark theme + filters | Modal        | `data-testid` |

---

## Key design decisions

### 1. Single selector map, all envs covered

[tests/helpers/selectors.ts](tests/helpers/selectors.ts) holds a per-env selector map. The same test code interacts with `stable`, `release`, and `int` without branching logic in specs — only the selectors change.

### 2. Auth with `storageState` — login once, reuse everywhere

Auth setup projects (`setup-stable`, `setup-release`, `setup-int`) log in once before each suite and persist `localStorage` to `.auth/{env}.json`. Every test starts already authenticated — no per-test login overhead.

### 3. Branch → environment mapping in CI

```
main     →  stable tests only
release  →  release tests only
int      →  int tests only
```

Pull requests run the tests of the branch they merge **into**, so a PR to `main` always runs stable. Pushing to `release` won't run stable tests. The daily schedule and a manual `all` run cover all three environments.

### 4. Merge gate on stable

A dedicated `Stable gate` job runs on every PR to `main` and is a **required status check** in branch protection. Any result other than success (failed, cancelled or skipped tests) blocks the merge, and the gate also fails if the PR didn't run the stable suite.

**See it in action:** [Demo PR #2](https://github.com/BRLorena/playwright-multi-env-framework/pull/2) renames the stable env's Add button id without updating the tests. 11 stable tests fail, the `Stable gate` fails, and the merge is blocked.

---

## Running locally

```bash
# Install dependencies
npm install
npx playwright install chromium

# Copy env file and fill credentials
cp .env.example .env   # or edit .env directly

# Run all environments (servers auto-start via webServer config)
npx playwright test

# Run a single environment
npx playwright test --project=stable
npx playwright test --project=release
npx playwright test --project=int

# Start a server manually (useful for exploratory testing)
npm run dev:stable    # http://localhost:3001
npm run dev:release   # http://localhost:3002
npm run dev:int       # http://localhost:3003
```

---

## Environment variables

Credentials are loaded from `.env` (never committed). The same variables are stored as GitHub Actions secrets for CI.

| Variable           | Description                    |
| ------------------ | ------------------------------ |
| `STABLE_USERNAME`  | Login username for stable env  |
| `STABLE_PASSWORD`  | Login password for stable env  |
| `RELEASE_USERNAME` | Login username for release env |
| `RELEASE_PASSWORD` | Login password for release env |
| `INT_USERNAME`     | Login username for int env     |
| `INT_PASSWORD`     | Login password for int env     |

---

## CI/CD

GitHub Actions workflow: [`.github/workflows/test.yml`](.github/workflows/test.yml)

Triggers:

- `push` → runs tests for the pushed branch's environment
- `pull_request` → runs tests for the target branch's environment (PRs to `main` run stable and must pass the `Stable gate`)
- `schedule` (daily 6am UTC) → runs all three environments
- `workflow_dispatch` → manually pick `stable`, `release`, `int`, or `all`

The Allure report is published to [GitHub Pages](https://brlorena.github.io/playwright-multi-env-framework/) only from `main`, so PRs and the `release`/`int` branches never overwrite it. Each run downloads the previous report's history so trends carry over.

### Pipeline speed

- Playwright browsers are cached between runs, and the install is skipped on a cache hit
- Only the server for the environment under test is started
- 1 retry in CI, with 5s action and assertion timeouts (Playwright's default is 30s): the app responds in milliseconds, so a broken selector fails in seconds

A green stable run executes its tests in about 12s. A broken build fails in about 2.5 minutes instead of 16 (measured on [PR #2](https://github.com/BRLorena/playwright-multi-env-framework/pull/2)).

The `Playwright webServer` config starts and stops the app automatically in CI — no separate server startup step needed.

---

## Tech stack

- **App:** Node.js, Express, TypeScript
- **Tests:** Playwright, TypeScript
- **Auth:** JWT-style token in `localStorage`, per-env credentials via env vars
- **CI:** GitHub Actions with matrix strategy and branch-scoped execution
