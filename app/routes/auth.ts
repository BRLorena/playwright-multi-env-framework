import { Router, Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

const authRouter = Router();

// Per-environment credentials from env vars
function getCredentials(envName: string) {
  const prefix = envName.toUpperCase();
  const username = process.env[`${prefix}_USERNAME`];
  const password = process.env[`${prefix}_PASSWORD`];
  if (!username || !password) {
    return null;
  }
  return { username, password };
}

// In-memory session tokens (resets on restart — good for testing)
const validTokens = new Set<string>();

// POST /api/login
authRouter.post("/", (req: Request, res: Response) => {
  const { username, password } = req.body;
  const envName = process.env.ENV_NAME || "int";
  const creds = getCredentials(envName);

  if (!creds) {
    return res
      .status(500)
      .json({ error: `Missing credentials env vars for ${envName}` });
  }

  if (username === creds.username && password === creds.password) {
    const token = uuidv4();
    validTokens.add(token);
    return res.json({ token, env: envName });
  }

  return res.status(401).json({ error: "Invalid credentials" });
});

// Middleware to protect API routes
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");

  if (token && validTokens.has(token)) {
    return next();
  }

  return res.status(401).json({ error: "Unauthorized" });
}

export { authRouter };
