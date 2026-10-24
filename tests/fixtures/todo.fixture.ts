import { test as base, BrowserContextOptions } from "@playwright/test";
import { TodoPage } from "../pages/todo.page";
import { LoginPage } from "../pages/login.page";
import { EnvName } from "../helpers/selectors";
import { getCredentials } from "../../config/environments";

type StorageState = Exclude<BrowserContextOptions["storageState"], string | undefined>;

export type TodoWorkerOptions = {
  /** Environment under test, set per project in playwright.config.ts */
  envName: EnvName;
};

type TodoWorkerFixtures = {
  /** Logged-in session shared by every test in this worker */
  session: { token: string; storageState: StorageState };
};

type TodoFixtures = {
  todoPage: TodoPage;
  /** Authorization header for direct API calls with the worker's session */
  authHeaders: Record<string, string>;
};

/**
 * Fixtures for the multi-env TODO suite.
 *
 * Auth follows Playwright's "one account per parallel worker" pattern:
 * each worker logs in once through the UI and every test in it starts
 * from that storageState. The app scopes data to the session, so workers
 * never touch each other's todos and tests run fully in parallel.
 */
export const test = base.extend<TodoFixtures, TodoWorkerOptions & TodoWorkerFixtures>({
  envName: ["stable", { option: true, scope: "worker" }],

  session: [
    async ({ browser, envName }, use, workerInfo) => {
      const { username, password } = getCredentials(envName);
      const page = await browser.newPage({
        storageState: undefined,
        baseURL: workerInfo.project.use.baseURL,
      });
      await new LoginPage(page).login(username, password);
      const storageState = await page.context().storageState();
      const token = await page.evaluate(() => localStorage.getItem("auth-token"));
      await page.close();
      await use({ token: token!, storageState });
    },
    { scope: "worker" },
  ],

  storageState: async ({ session }, use) => {
    await use(session.storageState);
  },

  authHeaders: async ({ session }, use) => {
    await use({ Authorization: `Bearer ${session.token}` });
  },

  todoPage: async ({ page, envName, authHeaders }, use) => {
    // Clean state before each test: tests in a worker share its session
    await page.request.delete("/api/todos", { headers: authHeaders });
    const todoPage = new TodoPage(page, envName);
    await todoPage.goto();
    await use(todoPage);
  },
});

export { expect } from "@playwright/test";
