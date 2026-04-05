import { test as base } from "@playwright/test";
import { TodoPage } from "../pages/todo.page";
import { EnvName } from "../helpers/selectors";

/**
 * Custom fixture that provides a TodoPage instance
 * configured for the current project's environment.
 */
type TodoFixtures = {
  todoPage: TodoPage;
  envName: EnvName;
};

export const test = base.extend<TodoFixtures>({
  envName: async ({}, use, testInfo) => {
    // Read env from the project name (stable | release | int)
    const env = testInfo.project.name as EnvName;
    await use(env);
  },

  todoPage: async ({ page, envName }, use) => {
    const todoPage = new TodoPage(page, envName);
    // Navigate first so localStorage (from storageState) is available
    await todoPage.goto();
    // Clean state before each test
    await todoPage.clearAllTodos();
    // Reload to reflect clean state
    await todoPage.goto();
    await use(todoPage);
  },
});

export { expect } from "@playwright/test";
