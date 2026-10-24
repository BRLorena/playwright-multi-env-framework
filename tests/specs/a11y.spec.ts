import { test, expect } from "../fixtures/todo.fixture";
import { LoginPage } from "../pages/login.page";
import { a11yViolations } from "../helpers/a11y";
import { getCredentials } from "../../config/environments";

/**
 * Accessibility tests — run on ALL environments (@all tag).
 *
 * axe-core checks each screen against WCAG 2.1 A/AA (contrast, labels,
 * roles, ...). The three UIs share no markup or CSS, so each env is
 * scanned in the states a user actually sees.
 */

test.describe("Accessibility @all", () => {
  test("todo list with active and completed items", async ({ todoPage }) => {
    await todoPage.addTodo("Active item");
    await todoPage.addTodo("Done item");
    await todoPage.toggleTodo("Done item");

    expect(await a11yViolations(todoPage.page)).toEqual([]);
  });

  test("edit mode (inline or modal)", async ({ todoPage }) => {
    await todoPage.addTodo("Edit me");
    await todoPage.openEdit("Edit me");

    expect(await a11yViolations(todoPage.page)).toEqual([]);
  });

  test("checkboxes are named after their todo", async ({ todoPage }) => {
    await todoPage.addTodo('Say "hi"');

    await expect(
      todoPage.page.getByRole("checkbox", { name: 'Complete Say "hi"' }),
    ).toBeVisible();
  });

  test.describe("logged out", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("login page with an error message", async ({ page, envName }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.submitCredentials(
        getCredentials(envName).username,
        "wrong-password",
      );
      await expect(loginPage.error).toBeVisible();

      expect(await a11yViolations(page)).toEqual([]);
    });
  });
});
