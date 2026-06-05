// Environment configuration. Loads .env if present, then reads process.env
// directly. Centralized so every module gets the same view of config.

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadDotEnv(): void {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadDotEnv();

export interface AppConfig {
  accessToken: string;
  apiUrl: string;
  mockMode: boolean;
  clientId: string;
  clientSecret: string;
}

export function loadConfig(): AppConfig {
  const mockMode = (process.env.JOBBER_MOCK_MODE ?? "false").toLowerCase() === "true";
  return {
    accessToken: process.env.JOBBER_ACCESS_TOKEN ?? "",
    apiUrl: process.env.JOBBER_API_URL ?? "https://api.getjobber.com/api/graphql",
    mockMode,
    clientId: process.env.JOBBER_CLIENT_ID ?? "",
    clientSecret: process.env.JOBBER_CLIENT_SECRET ?? "",
  };
}
