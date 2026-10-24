import { test, expect } from "../fixtures/todo.fixture";

/**
 * Environment-specific UI tests.
 *
 * These test features or behaviors unique to each environment,
 * demonstrating how tags control which tests run where. Selectors come
 * from the same per-env map the page object uses (todoPage.s), so a UI
 * change is fixed in one place.
 */

// ─── STABLE-only tests ─────────────────────────────

test.describe("Stable UI specifics @stable", () => {
  test("should use inline editing (no modal)", async ({ todoPage, page }) => {
    await todoPage.addTodo("Inline edit test");

    await todoPage.openEdit("Inline edit test");

    // Inline input appears inside the list item, and no modal exists
    await expect(
      todoPage.item("Inline edit test").locator(todoPage.s.inlineEditInput!),
    ).toBeVisible();
    await expect(page.locator(".modal-overlay")).toHaveCount(0);
  });

  test("should render todos as a plain list", async ({ todoPage, page }) => {
    await todoPage.addTodo("List item");

    await expect(page.locator(`${todoPage.s.listContainer} > li`)).toHaveCount(
      1,
    );
  });
});

// ─── RELEASE-only tests ────────────────────────────

test.describe("Release UI specifics @release", () => {
  test("should use a modal for editing and cancel it", async ({
    todoPage,
    page,
  }) => {
    await todoPage.addTodo("Modal edit test");
    const modal = page.locator(todoPage.s.modalOverlay!);

    await todoPage.openEdit("Modal edit test");
    await expect(modal).toHaveClass(/active/);
    await expect(page.locator(todoPage.s.modalInput!)).toHaveValue(
      "Modal edit test",
    );

    await page.locator(todoPage.s.modalCancel!).click();
    await expect(modal).not.toHaveClass(/active/);
    await expect(todoPage.itemTexts).toHaveText(["Modal edit test"]);
  });

  test("should render todos as cards", async ({ todoPage }) => {
    await todoPage.addTodo("Card item");

    const card = todoPage.item("Card item");
    await expect(card).toHaveCount(1);
    await expect(card.locator(".card-actions")).toBeVisible();
  });

  test("should close the modal on overlay click", async ({
    todoPage,
    page,
  }) => {
    await todoPage.addTodo("Overlay test");
    const modal = page.locator(todoPage.s.modalOverlay!);

    await todoPage.openEdit("Overlay test");
    await expect(modal).toHaveClass(/active/);

    // Click the overlay (not the modal content)
    await modal.click({ position: { x: 10, y: 10 } });
    await expect(modal).not.toHaveClass(/active/);
  });
});

// ─── INT-only tests ────────────────────────────────

test.describe("INT UI specifics @int", () => {
  test("should display the filter toolbar", async ({ todoPage, page }) => {
    await expect(page.getByTestId("toolbar")).toBeVisible();
    for (const filter of [
      todoPage.s.filterAll!,
      todoPage.s.filterActive!,
      todoPage.s.filterCompleted!,
    ]) {
      await expect(page.locator(filter)).toBeVisible();
    }
  });

  test("should filter active and completed todos", async ({ todoPage }) => {
    await todoPage.addTodo("Active task");
    await todoPage.addTodo("Done task");
    await todoPage.toggleTodo("Done task");

    await todoPage.filter("active");
    await expect(todoPage.itemTexts).toHaveText(["Active task"]);

    await todoPage.filter("completed");
    await expect(todoPage.itemTexts).toHaveText(["Done task"]);

    await todoPage.filter("all");
    await expect(todoPage.itemTexts).toHaveText(["Active task", "Done task"]);
  });

  test("should show the correct counter", async ({ todoPage }) => {
    await todoPage.addTodo("Task one");
    await todoPage.addTodo("Task two");
    await expect(todoPage.counter).toHaveText("2 items left");

    await todoPage.toggleTodo("Task one");
    await expect(todoPage.counter).toHaveText("1 item left");
  });

  test("should close the edit modal with Escape", async ({
    todoPage,
    page,
  }) => {
    await todoPage.addTodo("Escape test");
    const modal = page.locator(todoPage.s.modalOverlay!);

    await todoPage.openEdit("Escape test");
    await expect(modal).toHaveClass(/active/);

    await page.keyboard.press("Escape");
    await expect(modal).not.toHaveClass(/active/);
  });
});
