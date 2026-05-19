import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { signSessionToken, sessionCookieName } from "@/lib/auth/jwt";
import { getDb } from "@/lib/db/server";
import { logServerError } from "@/lib/server/logServerError";
import { ensureTrainerForTelegramUser } from "@/lib/server/ensureTrainer";
import { formatPgErrorForUi } from "@/lib/server/pgErrorMessage";
import { dbAcceptLegal } from "@/lib/server/trainlyMutations";
import { trainers } from "@/db/schema";

export const runtime = "nodejs";

const DEV_TELEGRAM_ID = BigInt("9000000000000");

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
  if (hdr !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = getDb();
  try {
    const { trainerId } = await ensureTrainerForTelegramUser(db, {
      telegramUserId: DEV_TELEGRAM_ID,
      displayName: "Dev тренер",
    });

    await db
      .update(trainers)
      .set({
        onboardingSeenAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(trainers.id, trainerId));

    await dbAcceptLegal(db, trainerId);

    const token = await signSessionToken({
      trainerId,
      telegramUserId: DEV_TELEGRAM_ID.toString(),
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
