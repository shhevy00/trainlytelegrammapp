const AUTH_FETCH_TIMEOUT_MS = 35_000;

/**
 * Клиентский вызов входа через Telegram WebApp `initData` (cookie выставляет сервер).
 */
export async function postTelegramWebAppAuth(
  initData: string,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), AUTH_FETCH_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch("/api/auth/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData }),
      credentials: "same-origin",
      signal: ctrl.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    if (e instanceof DOMException && e.name === "AbortError") {
      return { ok: false, error: "timeout", status: 0 };
    }
    if (e instanceof Error && e.name === "AbortError") {
      return { ok: false, error: "timeout", status: 0 };
    }
    return { ok: false, error: "network", status: 0 };
  }
  clearTimeout(timer);

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
