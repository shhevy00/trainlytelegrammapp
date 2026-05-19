/**
 * Загрузка `.env` / `.env.local` из корня репозитория для CLI-скриптов (tsx).
 * Не перезаписывает переменные, уже заданные в окружении.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(path.join(__dirname, ".."));

const ALLOWED_ENV_FILES = [".env", ".env.local"] as const;

export function getRepoRoot(): string {
  return repoRoot;
}

function resolveAllowedEnvPath(filename: (typeof ALLOWED_ENV_FILES)[number]): string {
  const resolved = path.resolve(repoRoot, filename);
  const rootWithSep = repoRoot.endsWith(path.sep) ? repoRoot : `${repoRoot}${path.sep}`;
  if (!resolved.startsWith(rootWithSep) && resolved !== repoRoot) {
    throw new Error("env_path_outside_repo");
  }
  return resolved;
}

export function parseDotEnv(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

export function loadRepoEnvFiles(): void {
  const merged: Record<string, string> = {};
  for (const filename of ALLOWED_ENV_FILES) {
    const p = resolveAllowedEnvPath(filename);
    if (!fs.existsSync(p)) continue;
    Object.assign(merged, parseDotEnv(fs.readFileSync(p, "utf8")));
  }
  for (const [key, value] of Object.entries(merged)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
