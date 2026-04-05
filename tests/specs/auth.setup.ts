import { test as setup, expect } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });

/**
 * Read credentials from env vars for the given environment.
 * Env vars follow the pattern: {ENV}_USERNAME, {ENV}_PASSWORD
 */
function getCredentials(envName: string) {
  const prefix = envName.toUpperCase();
  const username = process.env[`${prefix}_USERNAME`];
  const password = process.env[`${prefix}_PASSWORD`];
  if (!username || !password) {
    throw new Error(`Missing env vars ${prefix}_USERNAME / ${prefix}_PASSWORD`);
  }
  return { username, password };
}

/**
 * Auth setup — runs once per environment before the test suite.
 * Logs in via the login page and saves localStorage (with the auth token)
 * to a JSON file that subsequent test projects reuse via storageState.
 */
setup("authenticate", async ({ page }, testInfo) => {
  const envName = testInfo.project.name.replace("setup-", "");
  const creds = getCredentials(envName);

  const storageFile = path.resolve(__dirname, "..", ".auth", `${envName}.json`);

  // Navigate to the login page
  await page.goto("/login");

  // Fill in credentials
  await page.fill("#login-username", creds.username);
  await page.fill("#login-password", creds.password);
  await page.click("#login-submit");

  // Wait for redirect to the main page
  await page.waitForURL("/");

  // Verify we're logged in — the add button should be visible
  await expect(page.locator("body")).not.toContainText("Sign In");

  // Save storage state (includes localStorage with auth-token)
  await page.context().storageState({ path: storageFile });
});
