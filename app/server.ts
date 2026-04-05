import "dotenv/config";
import express from "express";
import path from "path";
import { todoRouter } from "./routes/todos";
import { authRouter, requireAuth } from "./routes/auth";

const app = express();
const ENV_NAME = process.env.ENV_NAME || "int";
const PORT_MAP: Record<string, number> = {
  stable: 3001,
  release: 3002,
  int: 3003,
};
const PORT = PORT_MAP[ENV_NAME] || 3003;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Resolve public dir — works both for ts-node (app/) and compiled (dist/)
const publicDir = path.resolve(__dirname, "..", "app", "public");

// Serve static files from the public directory (CSS, etc.)
app.use(express.static(publicDir));

// Auth API
app.use("/api/login", authRouter);

// API endpoint to get current environment (public)
app.get("/api/env", (_req, res) => {
  res.json({ env: ENV_NAME });
});

// Login page (public)
app.get("/login", (_req, res) => {
  res.sendFile(path.join(publicDir, `login-${ENV_NAME}.html`));
});

// Serve the main HTML page (public — JS on page handles auth redirect)
app.get("/", (_req, res) => {
  res.sendFile(path.join(publicDir, `index-${ENV_NAME}.html`));
});

// Protect API routes with auth
app.use("/api/todos", requireAuth, todoRouter);

app.listen(PORT, () => {
  console.log(
    `TODO App [${ENV_NAME.toUpperCase()}] running on http://localhost:${PORT}`,
  );
});

export default app;
