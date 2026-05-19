import { NextResponse } from "next/server";
import { signSessionToken, sessionCookieName } from "@/lib/auth/jwt";
import { timingSafeEqualString } from "@/lib/auth/secureCompare";
import { getDb } from "@/lib/db/server";
import { ensureDevTrainerSessionReady } from "@/lib/server/devTrainerSession";
import { logServerError } from "@/lib/server/logServerError";
import { formatPgErrorForUi } from "@/lib/server/pgErrorMessage";

export const runtime = "nodejs";

/**
 * Только development: выдаёт сессию фиктивному тренеру (без Telegram).
 * Заголовок: `x-trainly-dev-secret` = `TRAINLY_DEV_AUTH_SECRET`.
 */
export async function POST(req: Request): Promise<Response> {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const secret = process.env.TRAINLY_DEV_AUTH_SECRET;
  if (secret == null || secret.length === 0) {
    return NextResponse.json({ error: "dev_auth_not_configured" }, { status: 500 });
  }
  const hdr = req.headers.get("x-trainly-dev-secret");
  if (hdr == null || !timingSafeEqualString(hdr, secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = getDb();
  try {
    const { trainerId, telegramUserId } = await ensureDevTrainerSessionReady(db);
    const token = await signSessionToken({
      trainerId,
      telegramUserId,
    });
    const res = NextResponse.json({ ok: true as const, trainerId });
    res.cookies.set(sessionCookieName(), token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (e) {
    logServerError("api/auth/dev", e);
    return NextResponse.json({ error: "dev_auth_failed", message: formatPgErrorForUi(e) }, { status: 503 });
  }
}
