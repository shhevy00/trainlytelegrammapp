"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { sessionCookieName, signSessionToken } from "@/lib/auth/jwt";
import { getTrainerSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/server";
import {
  dbAcceptLegal,
  dbAddClient,
  dbAddCoachQuickNote,
  dbAddCompletedWorkout,
  dbAddNoteEntry,
  dbAddScheduleSlot,
  dbArchiveWorkoutTemplate,
  dbCompleteProfileSetup,
  dbCreateWorkoutTemplate,
  dbMarkOnboardingSeen,
  dbMarkScheduleCancelled,
  dbMarkScheduleMissed,
  dbRecordCoachPayment,
  dbSaveWorkoutAsTemplateFromJournal,
  dbSetSubscriptionStatus,
  dbTryConsumeAiCredit,
  dbUpdateWorkoutTemplate,
} from "@/lib/server/trainlyMutations";
import { loadTrainlySnapshot } from "@/lib/server/trainlySnapshot";
import type { TrainlySnapshot } from "@/lib/trainly/snapshotTypes";
import type { JournalCompletedWorkout, JournalNoteEntry } from "@/lib/types";
import type { CoachQuickNoteType } from "@/lib/mock/coachLedger";
import type { CreateWorkoutTemplateInput, UpdateWorkoutTemplateInput } from "@/lib/workout/templates";
import type { CompleteProfileSetupInput } from "@/lib/mock/lifecycleTypes";
import type { MockSubscriptionStatus } from "@/lib/mock/lifecycleTypes";
import { ensureTrainerForTelegramUser } from "@/lib/server/ensureTrainer";
import { trainerProductAccess, trainers } from "@/db/schema";
import type { AppDatabase } from "@/db/client";
import { canTrainerWriteCoreProduct, TrainlyProductAccessDeniedError } from "@/lib/billing/accessGate";

const DEV_TELEGRAM_ID = BigInt("9000000000000");

async function requireTrainerId(): Promise<string> {
  const s = await getTrainerSession();
  if (s == null) {
    throw new Error("UNAUTHORIZED");
  }
  return s.trainerId;
}

async function assertCoreProductWriteAllowed(db: AppDatabase, trainerId: string): Promise<void> {
  const rows = await db
    .select({
      accessStatus: trainerProductAccess.accessStatus,
      validUntil: trainerProductAccess.validUntil,
    })
    .from(trainerProductAccess)
    .where(eq(trainerProductAccess.trainerId, trainerId))
    .limit(1);
  if (!canTrainerWriteCoreProduct(rows[0])) {
    throw new TrainlyProductAccessDeniedError();
  }
}

export async function refreshTrainlySnapshotAction(): Promise<TrainlySnapshot> {
  const trainerId = await requireTrainerId();
  const db = getDb();
  return loadTrainlySnapshot(db, trainerId);
}

export async function trainlyAddClientAction(payload: {
  name: string;
  goal?: string;
  remainingSessions?: number;
  limitation?: string;
}): Promise<string> {
  const trainerId = await requireTrainerId();
  const db = getDb();
  await assertCoreProductWriteAllowed(db, trainerId);
  const id = await dbAddClient(db, trainerId, payload);
  revalidatePath("/");
  return id;
}

export async function trainlyAddCompletedWorkoutAction(entry: JournalCompletedWorkout): Promise<void> {
  const trainerId = await requireTrainerId();
  const db = getDb();
  await assertCoreProductWriteAllowed(db, trainerId);
  await dbAddCompletedWorkout(db, trainerId, entry);
  revalidatePath("/");
}

export async function trainlyAddNoteEntryAction(entry: JournalNoteEntry): Promise<void> {
  const trainerId = await requireTrainerId();
  const db = getDb();
  await assertCoreProductWriteAllowed(db, trainerId);
  await dbAddNoteEntry(db, trainerId, entry);
  revalidatePath("/");
}

export async function trainlyMarkScheduleMissedAction(scheduleItemId: string): Promise<void> {
  const trainerId = await requireTrainerId();
  const db = getDb();
  await assertCoreProductWriteAllowed(db, trainerId);
  await dbMarkScheduleMissed(db, trainerId, scheduleItemId);
  revalidatePath("/");
}

export async function trainlyMarkScheduleCancelledAction(scheduleItemId: string): Promise<void> {
  const trainerId = await requireTrainerId();
  const db = getDb();
  await assertCoreProductWriteAllowed(db, trainerId);
  await dbMarkScheduleCancelled(db, trainerId, scheduleItemId);
  revalidatePath("/");
}

export async function trainlyAddScheduleSlotAction(payload: {
  clientId: string;
  dateIso: string;
  time: string;
  title: string;
  durationMinutes: number;
  templateId?: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const trainerId = await requireTrainerId();
  const db = getDb();
  await assertCoreProductWriteAllowed(db, trainerId);
  const res = await dbAddScheduleSlot(db, trainerId, payload);
  revalidatePath("/");
  return res;
}

export async function trainlyRecordCoachPaymentAction(payload: {
  clientId: string;
  sessionsAdded: number;
  amountRub: number | null;
  comment: string | null;
}): Promise<void> {
  const trainerId = await requireTrainerId();
  const db = getDb();
  await assertCoreProductWriteAllowed(db, trainerId);
  await dbRecordCoachPayment(db, trainerId, payload);
  revalidatePath("/");
}

export async function trainlyAddCoachQuickNoteAction(payload: {
  clientId: string | null;
  type: CoachQuickNoteType;
  text: string;
}): Promise<void> {
  const trainerId = await requireTrainerId();
  const db = getDb();
  await assertCoreProductWriteAllowed(db, trainerId);
  await dbAddCoachQuickNote(db, trainerId, payload);
  revalidatePath("/");
}

export async function trainlyCreateWorkoutTemplateAction(
  input: CreateWorkoutTemplateInput,
): Promise<{ ok: true; id: string } | { ok: false; errors: string[] }> {
  const trainerId = await requireTrainerId();
  const db = getDb();
  await assertCoreProductWriteAllowed(db, trainerId);
  const res = await dbCreateWorkoutTemplate(db, trainerId, input);
  revalidatePath("/");
  return res;
}

export async function trainlyUpdateWorkoutTemplateAction(
  templateId: string,
  input: UpdateWorkoutTemplateInput,
): Promise<{ ok: true } | { ok: false; errors: string[] }> {
  const trainerId = await requireTrainerId();
  const db = getDb();
  await assertCoreProductWriteAllowed(db, trainerId);
  const res = await dbUpdateWorkoutTemplate(db, trainerId, templateId, input);
  revalidatePath("/");
  return res;
}

export async function trainlyArchiveWorkoutTemplateAction(
  templateId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trainerId = await requireTrainerId();
  const db = getDb();
  await assertCoreProductWriteAllowed(db, trainerId);
  const res = await dbArchiveWorkoutTemplate(db, trainerId, templateId);
  revalidatePath("/");
  return res;
}

export async function trainlySaveWorkoutAsTemplateAction(params: {
  workoutId: string;
  name: string;
}): Promise<{ ok: true; id: string } | { ok: false; errors: string[] }> {
  const trainerId = await requireTrainerId();
  const db = getDb();
  await assertCoreProductWriteAllowed(db, trainerId);
  const res = await dbSaveWorkoutAsTemplateFromJournal(db, trainerId, params);
  revalidatePath("/");
  return res;
}

export async function trainlyAcceptLegalAction(): Promise<void> {
  const trainerId = await requireTrainerId();
  const db = getDb();
  await dbAcceptLegal(db, trainerId);
  revalidatePath("/");
}

export async function trainlyCompleteProfileAction(input: CompleteProfileSetupInput): Promise<void> {
  const trainerId = await requireTrainerId();
  const db = getDb();
  await dbCompleteProfileSetup(db, trainerId, {
    displayName: input.displayName,
    specialization: input.specialization,
    city: input.city,
    timezone: input.timezone,
  });
  revalidatePath("/");
}

export async function trainlyMarkOnboardingSeenAction(): Promise<void> {
  const trainerId = await requireTrainerId();
  const db = getDb();
  await dbMarkOnboardingSeen(db, trainerId);
  revalidatePath("/");
}

export async function trainlySetSubscriptionStatusAction(status: MockSubscriptionStatus): Promise<void> {
  const trainerId = await requireTrainerId();
  const db = getDb();
  await dbSetSubscriptionStatus(db, trainerId, status);
  revalidatePath("/");
}

export async function trainlyTryConsumeAiCreditAction(): Promise<boolean> {
  const trainerId = await requireTrainerId();
  const db = getDb();
  await assertCoreProductWriteAllowed(db, trainerId);
  const ok = await dbTryConsumeAiCredit(db, trainerId);
  revalidatePath("/");
  return ok;
}

/**
 * Только development: cookie-сессия для фиктивного тренера (без Telegram).
 */
export async function enterDevTrainerSessionAction(): Promise<{ ok: boolean }> {
  if (process.env.NODE_ENV === "production") {
    return { ok: false };
  }
  if (process.env.TRAINLY_DEV_AUTH_SECRET == null || process.env.TRAINLY_DEV_AUTH_SECRET.length === 0) {
    return { ok: false };
  }
  const db = getDb();
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
  const jar = await cookies();
  jar.set(sessionCookieName(), token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  revalidatePath("/");
  return { ok: true };
}

export async function trainlyLogoutAction(): Promise<void> {
  const jar = await cookies();
  jar.delete(sessionCookieName());
  revalidatePath("/");
}
