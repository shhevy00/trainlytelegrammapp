import { eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { trainers } from "@/db/schema";
import { ensureTrainerForTelegramUser } from "@/lib/server/ensureTrainer";
import { dbAcceptLegal } from "@/lib/server/trainlyMutations";

export const DEV_TRAINER_TELEGRAM_USER_ID = BigInt("9000000000000");

/** Создаёт/находит dev-тренера, отмечает онбординг и legal. */
export async function ensureDevTrainerSessionReady(db: AppDatabase): Promise<{
  trainerId: string;
  telegramUserId: string;
}> {
  const { trainerId } = await ensureTrainerForTelegramUser(db, {
    telegramUserId: DEV_TRAINER_TELEGRAM_USER_ID,
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
  return {
    trainerId,
    telegramUserId: DEV_TRAINER_TELEGRAM_USER_ID.toString(),
  };
}
