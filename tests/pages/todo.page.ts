import { Page, Locator, expect } from "@playwright/test";
import { EnvSelectors, EnvName, getSelectors } from "../helpers/selectors";

/**
 * Page Object Model for the TODO app.
 *
 * Abstracts all interactions behind environment-aware selectors.
 * The same test code works across stable, release, and int environments.
 */
export class TodoPage {
  readonly page: Page;
  readonly env: EnvName;
  readonly s: EnvSelectors;

  constructor(page: Page, env: EnvName) {
    this.page = page;
    this.env = env;
    this.s = getSelectors(env);
  }

  // ─── Navigation ───────────────────────────────────

  async goto() {
    await this.page.goto("/");
    // Wait for the page to be fully loaded
    await this.page.waitForSelector(this.s.addButton);
  }

  // ─── CREATE ───────────────────────────────────────

  async addTodo(title: string) {
    await this.page.fill(this.s.todoInput, title);
    await this.page.click(this.s.addButton);
    // Wait for the new item to appear
    await this.page.waitForSelector(this.s.todoItemByText(title));
  }

  // ─── READ ─────────────────────────────────────────

  async getTodoItems(): Promise<Locator> {
    return this.page.locator(this.s.todoItem);
  }

  async getTodoCount(): Promise<number> {
    return await this.page.locator(this.s.todoItem).count();
  }

  async getTodoTexts(): Promise<string[]> {
    const items = this.page.locator(`${this.s.todoItem} ${this.s.todoText}`);
    return await items.allTextContents();
  }

  getTodoByText(text: string): Locator {
    return this.page.locator(this.s.todoItemByText(text));
  }

  async isEmptyStateVisible(): Promise<boolean> {
    return await this.page.locator(this.s.emptyState).isVisible();
  }

  // ─── UPDATE (toggle) ─────────────────────────────

  async toggleTodo(text: string) {
    const item = this.getTodoByText(text);
    await item.locator(this.s.todoCheckbox).click();
    // Wait for the UI to update
    await this.page.waitForTimeout(300);
  }

  async isTodoCompleted(text: string): Promise<boolean> {
    const item = this.getTodoByText(text);
    const checkbox = item.locator(this.s.todoCheckbox);
    return await checkbox.isChecked();
  }

  // ─── UPDATE (edit title) ─────────────────────────
  // This is the KEY method that differs between environments

  async editTodo(text: string, newTitle: string) {
    const item = this.getTodoByText(text);
    await item.locator(this.s.editButton).click();

    if (this.s.editMode === "inline") {
      // STABLE: inline editing
      const editInput = item.locator(this.s.inlineEditInput!);
      await editInput.clear();
      await editInput.fill(newTitle);
      await editInput.press("Enter");
    } else {
      // RELEASE & INT: modal editing
      const modalInput = this.page.locator(this.s.modalInput!);
      await expect(modalInput).toBeVisible();
      await modalInput.clear();
      await modalInput.fill(newTitle);
      await this.page.click(this.s.modalSave!);
    }

    // Wait for the updated item to appear
    await this.page.waitForSelector(this.s.todoItemByText(newTitle));
  }

  // ─── DELETE ───────────────────────────────────────

  async deleteTodo(text: string) {
    const item = this.getTodoByText(text);
    const countBefore = await this.getTodoCount();
    await item.locator(this.s.deleteButton).click();
    // Wait for item count to decrease
    await expect(this.page.locator(this.s.todoItem)).toHaveCount(
      countBefore - 1,
    );
  }

  // ─── INT-only: Filters ───────────────────────────

  async filterAll() {
    if (!this.s.filterAll) throw new Error("Filter not available in this env");
    await this.page.click(this.s.filterAll);
  }

  async filterActive() {
    if (!this.s.filterActive)
      throw new Error("Filter not available in this env");
    await this.page.click(this.s.filterActive);
  }

  async filterCompleted() {
    if (!this.s.filterCompleted)
      throw new Error("Filter not available in this env");
    await this.page.click(this.s.filterCompleted);
  }

  async getCounterText(): Promise<string> {
    if (!this.s.todoCounter)
      throw new Error("Counter not available in this env");
    return (await this.page.locator(this.s.todoCounter).textContent()) || "";
  }

  // ─── Cleanup ──────────────────────────────────────

  async clearAllTodos() {
    // Get auth token from localStorage (set by storageState)
    const token = await this.page.evaluate(() =>
      localStorage.getItem("auth-token"),
    );
    await this.page.request.delete("/api/todos", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }
}
