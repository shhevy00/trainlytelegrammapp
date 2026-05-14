import { NextResponse } from "next/server";
import { signSessionToken, sessionCookieName } from "@/lib/auth/jwt";
import { validateTelegramWebAppInitData } from "@/lib/auth/telegram";
import { getDb } from "@/lib/db/server";
import { logServerError } from "@/lib/server/logServerError";
import { ensureTrainerForTelegramUser } from "@/lib/server/ensureTrainer";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (botToken == null || botToken.length === 0) {
    return NextResponse.json({ error: "missing_bot_token" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch (e) {
    logServerError("api/auth/telegram/body", e);
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null || !("initData" in body)) {
    return NextResponse.json({ error: "missing_init_data" }, { status: 400 });
  }
  const initData = (body as { initData?: unknown }).initData;
  if (typeof initData !== "string" || initData.length === 0) {
    return NextResponse.json({ error: "missing_init_data" }, { status: 400 });
  }

  const safeMeta = { initDataLength: initData.length };

  let user: ReturnType<typeof validateTelegramWebAppInitData>;
  try {
    user = validateTelegramWebAppInitData(initData, botToken, 86_400);
  } catch (e) {
    logServerError("api/auth/telegram/validate", e, safeMeta);
    return NextResponse.json({ error: "auth_failed" }, { status: 401 });
  }

  try {
    const db = getDb();
    const { trainerId } = await ensureTrainerForTelegramUser(db, {
      telegramUserId: BigInt(user.id),
      displayName: user.firstName?.trim() || user.username?.trim() || "Тренер",
    });
    const token = await signSessionToken({
      trainerId,
      telegramUserId: String(user.id),
    });
    const res = NextResponse.json({ ok: true as const, trainerId });
    res.cookies.set(sessionCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (e) {
    logServerError("api/auth/telegram/session", e, {
      ...safeMeta,
      telegramUserId: user.id,
    });
    return NextResponse.json({ error: "auth_failed" }, { status: 401 });
  }
}
