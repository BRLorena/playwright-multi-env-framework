import { test, expect } from "../fixtures/todo.fixture";
import { getCredentials } from "../../config/environments";

/**
 * API tests — run on ALL environments (@all tag).
 *
 * The UI tests cover user flows; these cover the contract underneath:
 * validation, auth and per-session data isolation.
 */

test.describe("Todos API @all", () => {
  test.beforeEach(async ({ request, authHeaders }) => {
    await request.delete("/api/todos", { headers: authHeaders });
  });

  test("should create, update and delete a todo", async ({
    request,
    authHeaders,
  }) => {
    const created = await request.post("/api/todos", {
      headers: authHeaders,
      data: { title: "  API todo  " },
    });
    expect(created.status()).toBe(201);
    const todo = await created.json();
    expect(todo).toMatchObject({ title: "API todo", completed: false });

    const updated = await request.put(`/api/todos/${todo.id}`, {
      headers: authHeaders,
      data: { completed: true },
    });
    await expect(updated).toBeOK();
    expect(await updated.json()).toMatchObject({ completed: true });

    const deleted = await request.delete(`/api/todos/${todo.id}`, {
      headers: authHeaders,
    });
    await expect(deleted).toBeOK();

    const list = await request.get("/api/todos", { headers: authHeaders });
    expect(await list.json()).toEqual([]);
  });

  test("should reject a blank title", async ({ request, authHeaders }) => {
    const res = await request.post("/api/todos", {
      headers: authHeaders,
      data: { title: "   " },
    });

    expect(res.status()).toBe(400);
  });

  test("should return 404 for an unknown todo", async ({
    request,
    authHeaders,
  }) => {
    const res = await request.put("/api/todos/does-not-exist", {
      headers: authHeaders,
      data: { completed: true },
    });

    expect(res.status()).toBe(404);
  });

  test("should return 401 without a token", async ({ request }) => {
    const res = await request.get("/api/todos");

    expect(res.status()).toBe(401);
  });

  test("should return 401 for wrong credentials", async ({
    request,
    envName,
  }) => {
    const { username } = getCredentials(envName);
    const res = await request.post("/api/login", {
      data: { username, password: "wrong-password" },
    });

    expect(res.status()).toBe(401);
  });

  test("should keep each session's todos separate", async ({
    request,
    authHeaders,
    envName,
  }) => {
    const { username, password } = getCredentials(envName);
    const login = await request.post("/api/login", {
      data: { username, password },
    });
    const { token } = await login.json();
    const otherSession = { Authorization: `Bearer ${token}` };

    await request.post("/api/todos", {
      headers: authHeaders,
      data: { title: "Mine only" },
    });

    const others = await request.get("/api/todos", { headers: otherSession });
    expect(await others.json()).toEqual([]);
  });
});
