/**
 * Клиентский вызов входа через Telegram WebApp `initData` (cookie выставляет сервер).
 */
export async function postTelegramWebAppAuth(
  initData: string,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const res = await fetch("/api/auth/telegram", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData }),
    credentials: "same-origin",
  });
  if (!res.ok) {
    let error = "auth_failed";
    try {
      const j: unknown = await res.json();
      if (typeof j === "object" && j !== null && "error" in j && typeof (j as { error: unknown }).error === "string") {
        error = (j as { error: string }).error;
      }
    } catch {
      /* ignore */
    }
    return { ok: false, error, status: res.status };
  }
  return { ok: true };
}
