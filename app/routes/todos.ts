import { Router, Request, Response } from "express";
import { randomUUID } from "crypto";

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

// In-memory store, one list per session token (resets on restart — good for testing).
// Each login gets its own data, so parallel test workers never see each other's todos.
const todosBySession = new Map<string, Todo[]>();

function sessionTodos(res: Response): Todo[] {
  const token: string = res.locals.token;
  let todos = todosBySession.get(token);
  if (!todos) {
    todos = [];
    todosBySession.set(token, todos);
  }
  return todos;
}

export const todoRouter = Router();

// GET all todos
todoRouter.get("/", (_req: Request, res: Response) => {
  res.json(sessionTodos(res));
});

// GET single todo
todoRouter.get("/:id", (req: Request, res: Response) => {
  const todo = sessionTodos(res).find((t) => t.id === req.params.id);
  if (!todo) {
    return res.status(404).json({ error: "Todo not found" });
  }
  res.json(todo);
});

// POST create todo
todoRouter.post("/", (req: Request, res: Response) => {
  const { title } = req.body;
  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return res.status(400).json({ error: "Title is required" });
  }
  const todo: Todo = {
    id: randomUUID(),
    title: title.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
  };
  sessionTodos(res).push(todo);
  res.status(201).json(todo);
});

// PUT update todo
todoRouter.put("/:id", (req: Request, res: Response) => {
  const todos = sessionTodos(res);
  const index = todos.findIndex((t) => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Todo not found" });
  }
  const { title, completed } = req.body;
  if (title !== undefined) {
    if (typeof title !== "string" || title.trim().length === 0) {
      return res
        .status(400)
        .json({ error: "Title must be a non-empty string" });
    }
    todos[index].title = title.trim();
  }
  if (completed !== undefined) {
    todos[index].completed = Boolean(completed);
  }
  res.json(todos[index]);
});

// DELETE todo
todoRouter.delete("/:id", (req: Request, res: Response) => {
  const todos = sessionTodos(res);
  const index = todos.findIndex((t) => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Todo not found" });
  }
  const deleted = todos.splice(index, 1);
  res.json(deleted[0]);
});

// DELETE all todos (useful for test cleanup)
todoRouter.delete("/", (_req: Request, res: Response) => {
  todosBySession.set(res.locals.token, []);
  res.json({ message: "All todos deleted" });
});
