/**
 * Подробный лог в stdout (Docker / Coolify). Не передавайте секреты, токены, полный initData.
 */
export function logServerError(
  scope: string,
  err: unknown,
  extra?: Record<string, string | number | boolean | undefined>,
): void {
  const parts: string[] = [`[Trainly][${scope}]`];
  if (extra != null) {
    for (const [k, v] of Object.entries(extra)) {
      if (v !== undefined) parts.push(`${k}=${String(v)}`);
    }
  }
  if (err instanceof Error) {
    parts.push(`message=${err.message}`);
    if (err.stack != null && err.stack.length > 0) {
      parts.push(err.stack);
    }
    let cause: unknown = err.cause;
    let depth = 0;
    while (cause != null && depth < 6) {
      if (cause instanceof Error) {
        parts.push(`cause[${depth}] message=${cause.message}`);
        if (cause.stack != null && cause.stack.length > 0) {
          parts.push(cause.stack);
        }
        cause = cause.cause;
      } else {
        parts.push(`cause[${depth}]=${String(cause)}`);
        break;
      }
      depth += 1;
    }
  } else {
    parts.push(`nonError=${String(err)}`);
  }
  console.error(parts.join("\n"));
}
