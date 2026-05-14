/**
 * Разрешённые returnTo после /auth: только относительный путь приложения (без open-redirect).
 */
export function sanitizeReturnTo(raw: string | undefined): string | null {
  if (raw == null || raw.length === 0) return null;
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return null;
  if (t.includes("\\")) return null;
  if (!/^\/[\w\-./?=&%]*$/.test(t)) return null;
  return t;
}
