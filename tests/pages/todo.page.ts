import { Page, Locator, Response, expect } from "@playwright/test";
import { EnvSelectors, EnvName, getSelectors } from "../helpers/selectors";

/**
 * Page Object Model for the TODO app.
 *
 * Abstracts all interactions behind environment-aware selectors.
 * The same test code works across stable, release, and int environments.
 *
 * Actions wait for the app to finish reloading the list from the API,
 * so tests never need fixed sleeps; assertions live in the tests and
 * use web-first (auto-retrying) expects on the locators exposed here.
 */
export class TodoPage {
  readonly page: Page;
  readonly env: EnvName;
  readonly s: EnvSelectors;

  readonly input: Locator;
  readonly addButton: Locator;
  readonly items: Locator;
  readonly itemTexts: Locator;
  readonly emptyState: Locator;

  constructor(page: Page, env: EnvName) {
    this.page = page;
    this.env = env;
    this.s = getSelectors(env);

    this.input = page.locator(this.s.todoInput);
    this.addButton = page.locator(this.s.addButton);
    this.items = page.locator(this.s.todoItem);
    this.itemTexts = this.items.locator(this.s.todoText);
    this.emptyState = page.locator(this.s.emptyState);
  }

  // ─── Navigation ───────────────────────────────────

  async goto() {
    const listLoaded = this.waitForListReload();
    await this.page.goto("/");
    await listLoaded;
  }

  // ─── Locators ─────────────────────────────────────

  /** The todo whose title is exactly `text` */
  item(text: string): Locator {
    return this.items.filter({
      has: this.page.locator(this.s.todoText, { hasText: exactText(text) }),
    });
  }

  checkbox(text: string): Locator {
    return this.item(text).locator(this.s.todoCheckbox);
  }

  // ─── CREATE ───────────────────────────────────────

  async addTodo(title: string) {
    await this.input.fill(title);
    await this.reloadAfter(() => this.addButton.click());
  }

  // ─── UPDATE (toggle) ─────────────────────────────

  async toggleTodo(text: string) {
    await this.reloadAfter(() => this.checkbox(text).click());
  }

  // ─── UPDATE (edit title) ─────────────────────────
  // This is the KEY method that differs between environments

  async openEdit(text: string) {
    await this.item(text).locator(this.s.editButton).click();
  }

  async editTodo(text: string, newTitle: string) {
    await this.openEdit(text);

    if (this.s.editMode === "inline") {
      // STABLE: inline editing
      const editInput = this.item(text).locator(this.s.inlineEditInput!);
      await editInput.fill(newTitle);
      await this.reloadAfter(() => editInput.press("Enter"));
    } else {
      // RELEASE & INT: modal editing
      const modalInput = this.page.locator(this.s.modalInput!);
      await expect(modalInput).toBeVisible();
      await modalInput.fill(newTitle);
      await this.reloadAfter(() =>
        this.page.locator(this.s.modalSave!).click(),
      );
    }
  }

  // ─── DELETE ───────────────────────────────────────

  async deleteTodo(text: string) {
    await this.reloadAfter(() =>
      this.item(text).locator(this.s.deleteButton).click(),
    );
  }

  // ─── INT-only: Filters ───────────────────────────

  async filter(name: "all" | "active" | "completed") {
    const selector = {
      all: this.s.filterAll,
      active: this.s.filterActive,
      completed: this.s.filterCompleted,
    }[name];
    if (!selector) throw new Error(`Filters not available in ${this.env}`);
    await this.page.locator(selector).click();
  }

  get counter(): Locator {
    if (!this.s.todoCounter)
      throw new Error(`Counter not available in ${this.env}`);
    return this.page.locator(this.s.todoCounter);
  }

  // ─── Sync helpers ─────────────────────────────────

  /** Resolves when the app re-fetches the todo list (GET /api/todos) */
  private waitForListReload(): Promise<Response> {
    return this.page.waitForResponse(
      (res) =>
        res.request().method() === "GET" &&
        new URL(res.url()).pathname === "/api/todos",
    );
  }

  /** Runs a UI action that changes data, then waits for the list reload */
  private async reloadAfter(action: () => Promise<void>) {
    const reloaded = this.waitForListReload();
    await action();
    await reloaded;
  }
}

/** Regex matching `text` exactly (after trimming), with regex chars escaped */
function exactText(text: string): RegExp {
  return new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`);
}
