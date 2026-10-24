/**
 * Single source of truth for the environments under test.
 *
 * Adding an environment = one entry here + its selectors in
 * tests/helpers/selectors.ts. playwright.config.ts generates the
 * Playwright project and (for local targets) the web server from it.
 *
 * By default each env runs locally on its own port. Set
 * {ENV}_BASE_URL (e.g. STABLE_BASE_URL=https://stable.example.com)
 * to point the same suite at a deployed environment instead.
 */

export const ENV_NAMES = ["stable", "release", "int"] as const;

export type EnvName = (typeof ENV_NAMES)[number];

export interface Environment {
  name: EnvName;
  port: number;
  baseURL: string;
  /** True when the suite starts the app itself (no {ENV}_BASE_URL set) */
  local: boolean;
}

const PORTS: Record<EnvName, number> = {
  stable: 3001,
  release: 3002,
  int: 3003,
};

export function getEnvironment(name: EnvName): Environment {
  const port = PORTS[name];
  const override = process.env[`${name.toUpperCase()}_BASE_URL`];
  return {
    name,
    port,
    baseURL: override || `http://localhost:${port}`,
    local: !override,
  };
}

/**
 * Environments selected for this run. TEST_ENVS (e.g. "stable" or
 * "stable,int") limits the run; CI sets it to the env under test.
 */
export function selectedEnvironments(): Environment[] {
  const requested = process.env.TEST_ENVS?.split(",").map((env) => env.trim());
  if (!requested) return ENV_NAMES.map(getEnvironment);

  const unknown = requested.filter(
    (env) => !(ENV_NAMES as readonly string[]).includes(env),
  );
  if (unknown.length) {
    throw new Error(
      `Unknown TEST_ENVS: ${unknown.join(", ")}. Valid: ${ENV_NAMES.join(", ")}`,
    );
  }
  return (requested as EnvName[]).map(getEnvironment);
}

/** Login credentials for an env, from {ENV}_USERNAME / {ENV}_PASSWORD */
export function getCredentials(name: EnvName) {
  const prefix = name.toUpperCase();
  const username = process.env[`${prefix}_USERNAME`];
  const password = process.env[`${prefix}_PASSWORD`];
  if (!username || !password) {
    throw new Error(`Missing env vars ${prefix}_USERNAME / ${prefix}_PASSWORD`);
  }
  return { username, password };
}
