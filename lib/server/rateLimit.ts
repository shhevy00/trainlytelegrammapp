const buckets = new Map<string, { count: number; resetAtMs: number }>();

/**
 * Простой in-memory rate limit (на один инстанс Node). Для auth endpoint.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: true } | { allowed: false; retryAfterSec: number } {
  const now = Date.now();
  const row = buckets.get(key);
  if (row == null || now >= row.resetAtMs) {
    buckets.set(key, { count: 1, resetAtMs: now + windowMs });
    return { allowed: true };
  }
  if (row.count >= limit) {
    const retryAfterSec = Math.max(1, Math.ceil((row.resetAtMs - now) / 1000));
    return { allowed: false, retryAfterSec };
  }
  row.count += 1;
  return { allowed: true };
}

export function clientIpFromRequest(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded != null && forwarded.length > 0) {
    return forwarded.split(",")[0]!.trim();
  }
  return "unknown";
}
