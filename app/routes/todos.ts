import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

// In-memory store (resets on restart — good for testing)
let todos: Todo[] = [];

export const todoRouter = Router();

// GET all todos
todoRouter.get("/", (_req: Request, res: Response) => {
  res.json(todos);
});

// GET single todo
todoRouter.get("/:id", (req: Request, res: Response) => {
  const todo = todos.find((t) => t.id === req.params.id);
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
    id: uuidv4(),
    title: title.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
  };
  todos.push(todo);
  res.status(201).json(todo);
});

// PUT update todo
todoRouter.put("/:id", (req: Request, res: Response) => {
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
  const index = todos.findIndex((t) => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Todo not found" });
  }
  const deleted = todos.splice(index, 1);
  res.json(deleted[0]);
});

// DELETE all todos (useful for test cleanup)
todoRouter.delete("/", (_req: Request, res: Response) => {
  todos = [];
  res.json({ message: "All todos deleted" });
});
