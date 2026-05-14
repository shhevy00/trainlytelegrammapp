import { eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { trainerAccessEvents, trainerProductAccess, trainers } from "@/db/schema";

function trialValidUntil(): Date {
  const raw = process.env.TRAINLY_TRIAL_DAYS;
  const days = raw != null && raw.length > 0 ? Number(raw) : 14;
  const d = new Date();
  const n = Number.isFinite(days) && days >= 1 ? Math.floor(days) : 14;
  d.setDate(d.getDate() + n);
  return d;
}
/**
 * Находит или создаёт тренера по Telegram user id и гарантирует строку `trainer_product_access`.
 */
export async function ensureTrainerForTelegramUser(
  db: AppDatabase,
  params: { telegramUserId: bigint; displayName: string },
): Promise<{ trainerId: string }> {
  const existingRows = await db
    .select({ id: trainers.id, displayName: trainers.displayName })
    .from(trainers)
    .where(eq(trainers.telegramUserId, params.telegramUserId))
    .limit(1);
  const existing = existingRows[0];

  if (existing != null) {
    const nextName = params.displayName.trim() || existing.displayName;
    await db
      .update(trainers)
      .set({
        displayName: nextName,
        updatedAt: new Date(),
      })
      .where(eq(trainers.id, existing.id));

    const accessRows = await db
      .select({ trainerId: trainerProductAccess.trainerId })
      .from(trainerProductAccess)
      .where(eq(trainerProductAccess.trainerId, existing.id))
      .limit(1);
    if (accessRows.length === 0) {
      const until = trialValidUntil();
      await db.insert(trainerProductAccess).values({
        trainerId: existing.id,
        accessStatus: "trial",
        validUntil: until,
      });
      await db.insert(trainerAccessEvents).values({
        trainerId: existing.id,
        eventKind: "access_row_backfill_trial",
        accessStatus: "trial",
        source: "ensure_trainer_existing",
      });
    }
    return { trainerId: existing.id };
  }

  const inserted = await db
    .insert(trainers)
    .values({
      telegramUserId: params.telegramUserId,
      displayName: params.displayName.trim() || "Тренер",
    })
    .returning({ id: trainers.id });

  const row = inserted[0];
  if (row == null) {
    throw new Error("trainer_insert_failed");
  }

  await db.insert(trainerProductAccess).values({
    trainerId: row.id,
    accessStatus: "trial",
    validUntil: trialValidUntil(),
  });
  await db.insert(trainerAccessEvents).values({
    trainerId: row.id,
    eventKind: "signup_trial",
    accessStatus: "trial",
    source: "ensure_trainer_new",
  });
  return { trainerId: row.id };
}
