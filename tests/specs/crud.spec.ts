import { test, expect } from "../fixtures/todo.fixture";

/**
 * Core CRUD tests — run on ALL environments (@all tag).
 *
 * These tests exercise the same user flows across stable, release, and int
 * but the underlying selectors and interaction patterns differ per env.
 */

test.describe("TODO CRUD Operations @all", () => {
  test("should show empty state when no todos exist", async ({ todoPage }) => {
    const isEmpty = await todoPage.isEmptyStateVisible();
    expect(isEmpty).toBeTruthy();
    const count = await todoPage.getTodoCount();
    expect(count).toBe(0);
  });

  test("should create a new todo", async ({ todoPage }) => {
    await todoPage.addTodo("Buy groceries");

    const count = await todoPage.getTodoCount();
    expect(count).toBe(1);

    const texts = await todoPage.getTodoTexts();
    expect(texts).toContain("Buy groceries");
  });

  test("should create multiple todos", async ({ todoPage }) => {
    await todoPage.addTodo("First task");
    await todoPage.addTodo("Second task");
    await todoPage.addTodo("Third task");

    const count = await todoPage.getTodoCount();
    expect(count).toBe(3);

    const texts = await todoPage.getTodoTexts();
    expect(texts).toEqual(["First task", "Second task", "Third task"]);
  });

  test("should toggle a todo as completed", async ({ todoPage }) => {
    await todoPage.addTodo("Complete me");

    await todoPage.toggleTodo("Complete me");

    const isCompleted = await todoPage.isTodoCompleted("Complete me");
    expect(isCompleted).toBeTruthy();
  });

  test("should toggle a todo back to active", async ({ todoPage }) => {
    await todoPage.addTodo("Toggle me");

    // Complete it
    await todoPage.toggleTodo("Toggle me");
    expect(await todoPage.isTodoCompleted("Toggle me")).toBeTruthy();

    // Un-complete it
    await todoPage.toggleTodo("Toggle me");
    expect(await todoPage.isTodoCompleted("Toggle me")).toBeFalsy();
  });

  test("should edit a todo title", async ({ todoPage }) => {
    await todoPage.addTodo("Old title");

    await todoPage.editTodo("Old title", "New title");

    const texts = await todoPage.getTodoTexts();
    expect(texts).toContain("New title");
    expect(texts).not.toContain("Old title");
  });

  test("should delete a todo", async ({ todoPage }) => {
    await todoPage.addTodo("Delete me");
    await todoPage.addTodo("Keep me");

    await todoPage.deleteTodo("Delete me");

    const count = await todoPage.getTodoCount();
    expect(count).toBe(1);

    const texts = await todoPage.getTodoTexts();
    expect(texts).not.toContain("Delete me");
    expect(texts).toContain("Keep me");
  });

  test("should show empty state after deleting all todos", async ({
    todoPage,
  }) => {
    await todoPage.addTodo("Only one");
    await todoPage.deleteTodo("Only one");

    const isEmpty = await todoPage.isEmptyStateVisible();
    expect(isEmpty).toBeTruthy();
  });

  test("full CRUD flow: create, read, update, delete", async ({ todoPage }) => {
    // CREATE
    await todoPage.addTodo("CRUD test item");
    expect(await todoPage.getTodoCount()).toBe(1);

    // READ
    const texts1 = await todoPage.getTodoTexts();
    expect(texts1).toContain("CRUD test item");

    // UPDATE - toggle
    await todoPage.toggleTodo("CRUD test item");
    expect(await todoPage.isTodoCompleted("CRUD test item")).toBeTruthy();

    // UPDATE - edit
    await todoPage.editTodo("CRUD test item", "Updated CRUD item");
    const texts2 = await todoPage.getTodoTexts();
    expect(texts2).toContain("Updated CRUD item");

    // DELETE
    await todoPage.deleteTodo("Updated CRUD item");
    expect(await todoPage.getTodoCount()).toBe(0);
  });
});
