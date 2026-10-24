import { test, expect } from "../fixtures/todo.fixture";

/**
 * Core CRUD tests — run on ALL environments (@all tag).
 *
 * These tests exercise the same user flows across stable, release, and int
 * but the underlying selectors and interaction patterns differ per env.
 */

test.describe("TODO CRUD Operations @all", () => {
  test("should show empty state when no todos exist", async ({ todoPage }) => {
    await expect(todoPage.emptyState).toBeVisible();
    await expect(todoPage.items).toHaveCount(0);
  });

  test("should create a new todo", async ({ todoPage }) => {
    await todoPage.addTodo("Buy groceries");

    await expect(todoPage.itemTexts).toHaveText(["Buy groceries"]);
    await expect(todoPage.emptyState).toBeHidden();
  });

  test("should create multiple todos in order", async ({ todoPage }) => {
    await todoPage.addTodo("First task");
    await todoPage.addTodo("Second task");
    await todoPage.addTodo("Third task");

    await expect(todoPage.itemTexts).toHaveText([
      "First task",
      "Second task",
      "Third task",
    ]);
  });

  test("should toggle a todo as completed", async ({ todoPage }) => {
    await todoPage.addTodo("Complete me");

    await todoPage.toggleTodo("Complete me");

    await expect(todoPage.checkbox("Complete me")).toBeChecked();
  });

  test("should toggle a todo back to active", async ({ todoPage }) => {
    await todoPage.addTodo("Toggle me");

    await todoPage.toggleTodo("Toggle me");
    await expect(todoPage.checkbox("Toggle me")).toBeChecked();

    await todoPage.toggleTodo("Toggle me");
    await expect(todoPage.checkbox("Toggle me")).not.toBeChecked();
  });

  test("should keep the completed state after a reload", async ({
    todoPage,
  }) => {
    await todoPage.addTodo("Persist me");
    await todoPage.toggleTodo("Persist me");

    await todoPage.goto();

    await expect(todoPage.checkbox("Persist me")).toBeChecked();
  });

  test("should edit a todo title", async ({ todoPage }) => {
    await todoPage.addTodo("Old title");

    await todoPage.editTodo("Old title", "New title");

    await expect(todoPage.itemTexts).toHaveText(["New title"]);
  });

  test("should delete a todo", async ({ todoPage }) => {
    await todoPage.addTodo("Delete me");
    await todoPage.addTodo("Keep me");

    await todoPage.deleteTodo("Delete me");

    await expect(todoPage.itemTexts).toHaveText(["Keep me"]);
  });

  test("should show empty state after deleting all todos", async ({
    todoPage,
  }) => {
    await todoPage.addTodo("Only one");
    await todoPage.deleteTodo("Only one");

    await expect(todoPage.emptyState).toBeVisible();
    await expect(todoPage.items).toHaveCount(0);
  });

  test("should not create a todo with a blank title", async ({ todoPage }) => {
    await todoPage.input.fill("   ");
    await todoPage.addButton.click();

    await expect(todoPage.items).toHaveCount(0);
    await expect(todoPage.emptyState).toBeVisible();
  });

  test("full CRUD flow: create, read, update, delete", async ({ todoPage }) => {
    // CREATE + READ
    await todoPage.addTodo("CRUD test item");
    await expect(todoPage.itemTexts).toHaveText(["CRUD test item"]);

    // UPDATE - toggle
    await todoPage.toggleTodo("CRUD test item");
    await expect(todoPage.checkbox("CRUD test item")).toBeChecked();

    // UPDATE - edit
    await todoPage.editTodo("CRUD test item", "Updated CRUD item");
    await expect(todoPage.itemTexts).toHaveText(["Updated CRUD item"]);

    // DELETE
    await todoPage.deleteTodo("Updated CRUD item");
    await expect(todoPage.items).toHaveCount(0);
  });
});
