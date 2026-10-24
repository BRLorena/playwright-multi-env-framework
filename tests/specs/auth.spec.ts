import { test, expect } from "../fixtures/todo.fixture";
import { LoginPage } from "../pages/login.page";
import { getCredentials } from "../../config/environments";

/**
 * Login flow tests — run on ALL environments (@all tag).
 *
 * These start logged out (empty storageState) instead of reusing the
 * worker's session.
 */

test.describe("Authentication @all", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("should redirect to the login page when logged out", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/login$/);
  });

  test("should log in with valid credentials", async ({ page, envName }) => {
    const { username, password } = getCredentials(envName);
    const loginPage = new LoginPage(page);

    await loginPage.login(username, password);

    await expect(page).toHaveURL(/\/$/);
  });

  test("should reject a wrong password", async ({ page, envName }) => {
    const { username } = getCredentials(envName);
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.submitCredentials(username, "wrong-password");

    await expect(loginPage.error).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});
