import { test, expect } from "../fixtures/todo.fixture";

/**
 * Environment-specific UI tests.
 *
 * These test features or behaviors unique to each environment,
 * demonstrating how tags control which tests run where.
 */

// ─── STABLE-only tests ─────────────────────────────

test.describe("Stable UI specifics @stable", () => {
  test("should use inline editing (no modal)", async ({ todoPage, page }) => {
    await todoPage.addTodo("Inline edit test");

    // Click edit — should reveal an inline input, not a modal
    const item = todoPage.getTodoByText("Inline edit test");
    await item.locator(".edit-btn").click();

    // Inline input should appear inside the list item
    const inlineInput = item.locator(".inline-edit");
    await expect(inlineInput).toBeVisible();

    // No modal should be present
    const modal = page.locator(".modal-overlay");
    await expect(modal).toHaveCount(0);
  });

  test("should have id-based form selectors", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#add-todo-form")).toBeVisible();
    await expect(page.locator("#todo-input")).toBeVisible();
    await expect(page.locator("#add-todo")).toBeVisible();
  });
});

// ─── RELEASE-only tests ────────────────────────────

test.describe("Release UI specifics @release", () => {
  test("should use modal for editing", async ({ todoPage, page }) => {
    await todoPage.addTodo("Modal edit test");

    // Click edit — should open a modal
    const card = todoPage.getTodoByText("Modal edit test");
    await card.locator(".edit-icon").click();

    const modal = page.locator("#edit-modal");
    await expect(modal).toHaveClass(/active/);

    // Cancel the modal
    await page.click("#modal-cancel");
    await expect(modal).not.toHaveClass(/active/);
  });

  test("should render todos as cards", async ({ todoPage, page }) => {
    await todoPage.addTodo("Card item");

    const card = page.locator(".todo-card");
    await expect(card).toHaveCount(1);

    // Should have card-specific classes
    await expect(card.locator(".card-title")).toBeVisible();
    await expect(card.locator(".card-actions")).toBeVisible();
  });

  test("should close modal on overlay click", async ({ todoPage, page }) => {
    await todoPage.addTodo("Overlay test");

    const card = todoPage.getTodoByText("Overlay test");
    await card.locator(".edit-icon").click();

    const modal = page.locator("#edit-modal");
    await expect(modal).toHaveClass(/active/);

    // Click the overlay (not the modal content)
    await modal.click({ position: { x: 10, y: 10 } });
    await expect(modal).not.toHaveClass(/active/);
  });
});

// ─── INT-only tests ────────────────────────────────

test.describe("INT UI specifics @int", () => {
  test("should have data-testid selectors", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('[data-testid="add-todo-form"]')).toBeVisible();
    await expect(page.locator('[data-testid="todo-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-todo"]')).toBeVisible();
  });

  test("should display filter toolbar", async ({ todoPage, page }) => {
    await expect(page.locator('[data-testid="toolbar"]')).toBeVisible();
    await expect(page.locator('[data-testid="filter-all"]')).toBeVisible();
    await expect(page.locator('[data-testid="filter-active"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="filter-completed"]'),
    ).toBeVisible();
  });

  test("should filter active todos", async ({ todoPage }) => {
    await todoPage.addTodo("Active task");
    await todoPage.addTodo("Done task");
    await todoPage.toggleTodo("Done task");

    await todoPage.filterActive();

    const texts = await todoPage.getTodoTexts();
    expect(texts).toContain("Active task");
    expect(texts).not.toContain("Done task");
  });

  test("should filter completed todos", async ({ todoPage }) => {
    await todoPage.addTodo("Active task");
    await todoPage.addTodo("Done task");
    await todoPage.toggleTodo("Done task");

    await todoPage.filterCompleted();

    const texts = await todoPage.getTodoTexts();
    expect(texts).toContain("Done task");
    expect(texts).not.toContain("Active task");
  });

  test("should show correct counter", async ({ todoPage }) => {
    await todoPage.addTodo("Task one");
    await todoPage.addTodo("Task two");

    let counter = await todoPage.getCounterText();
    expect(counter).toBe("2 items left");

    await todoPage.toggleTodo("Task one");
    counter = await todoPage.getCounterText();
    expect(counter).toBe("1 item left");
  });

  test("should use modal for editing", async ({ todoPage, page }) => {
    await todoPage.addTodo("Modal in INT");

    const item = todoPage.getTodoByText("Modal in INT");
    await item.locator(".action-edit").click();

    const modal = page.locator('[data-testid="edit-modal"]');
    await expect(modal).toHaveClass(/active/);

    await page.click('[data-testid="modal-cancel"]');
    await expect(modal).not.toHaveClass(/active/);
  });
});
