import { Page, Locator, expect } from "@playwright/test";

/**
 * Page Object Model for the login page.
 *
 * The login form uses the same ids in every environment, so this page
 * object needs no per-env selectors.
 */
export class LoginPage {
  readonly page: Page;
  readonly username: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly error: Locator;

  constructor(page: Page) {
    this.page = page;
    this.username = page.locator("#login-username");
    this.password = page.locator("#login-password");
    this.submit = page.locator("#login-submit");
    this.error = page.locator("#login-error");
  }

  async goto() {
    await this.page.goto("/login");
  }

  async submitCredentials(username: string, password: string) {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.submit.click();
  }

  /** Logs in and waits until the app has stored the auth token */
  async login(username: string, password: string) {
    await this.goto();
    await this.submitCredentials(username, password);
    await this.page.waitForURL("/");
    await expect
      .poll(() => this.page.evaluate(() => localStorage.getItem("auth-token")))
      .toBeTruthy();
  }
}
