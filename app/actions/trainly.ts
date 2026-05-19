"use server";

import { and, eq } from "drizzle-orm";
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
  dbDeleteTrainerAccount,
  dbSetSubscriptionStatus,
  dbUpdateWorkoutTemplate,
  dbUpdateJournalNote,
  dbUpdateJournalWorkout,
} from "@/lib/server/trainlyMutations";
import {
  ActiveWorkoutConflictError,
  dbDeleteActiveWorkout,
  dbLoadActiveWorkout,
  dbUpsertActiveWorkout,
  type PersistedWorkoutDraft,
} from "@/lib/server/workoutDrafts";
import { loadTrainlySnapshot } from "@/lib/server/trainlySnapshot";
import { revalidateTrainlyBillingPaths, revalidateTrainlyClientPaths, revalidateTrainlyCorePaths } from "@/lib/server/revalidatePaths";
import type { TrainlySnapshot } from "@/lib/trainly/snapshotTypes";
import type { CoachQuickNoteType } from "@/lib/mock/coachLedger";
import type { CreateWorkoutTemplateInput, UpdateWorkoutTemplateInput } from "@/lib/workout/templates";
import type { CompleteProfileSetupInput } from "@/lib/mock/lifecycleTypes";
import type { MockSubscriptionStatus } from "@/lib/mock/lifecycleTypes";
import { ensureDevTrainerSessionReady } from "@/lib/server/devTrainerSession";
import { formatPgErrorForUi } from "@/lib/server/pgErrorMessage";
import { clients, trainerProductAccess } from "@/db/schema";
import type { AppDatabase } from "@/db/client";
import {
  canOverrideSubscriptionStatusInRuntime,
  canTrainerWriteCoreProduct,
  TrainlyProductAccessDeniedError,
} from "@/lib/billing/accessGate";
import { TrainlyClientLimitError } from "@/lib/billing/planLimits";
import {
  parseAddClientPayload,
  parseJournalCompletedWorkout,
  parseJournalNoteEntry,
} from "@/lib/validation/trainlyActions";
import type {
  JournalNoteUpdateInput,
  JournalWorkoutUpdateInput,
} from "@/lib/journal/validateJournalUpdate";
import { validateJournalNoteUpdate, validateJournalWorkoutUpdate } from "@/lib/journal/validateJournalUpdate";
import type { WorkoutSessionState } from "@/lib/workout/types";

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

export async function trainlyAddClientAction(payload: unknown): Promise<string> {
  const parsed = parseAddClientPayload(payload);
  if (!parsed.ok) {
    throw new Error("invalid_payload");
  }
  const trainerId = await requireTrainerId();
  const db = getDb();
  await assertCoreProductWriteAllowed(db, trainerId);
  try {
    const id = await dbAddClient(db, trainerId, parsed);
    revalidateTrainlyClientPaths();
    return id;
  } catch (e) {
    if (e instanceof TrainlyClientLimitError) {
      throw new TrainlyProductAccessDeniedError(
        `Достигнут лимит тарифа: не более ${e.limit} активных клиентов. Перейдите на тариф с большим лимитом.`,
      );
    }
    throw e;
  }
}

export async function trainlyAddCompletedWorkoutAction(entry: unknown): Promise<void> {
  const parsed = parseJournalCompletedWorkout(entry);
  if (parsed == null) {
    throw new Error("invalid_payload");
  }
  const trainerId = await requireTrainerId();
  const db = getDb();
  await assertCoreProductWriteAllowed(db, trainerId);
  await dbAddCompletedWorkout(db, trainerId, parsed);
  revalidateTrainlyClientPaths(parsed.clientId);
}

export async function trainlyAddNoteEntryAction(entry: unknown): Promise<void> {
  const parsed = parseJournalNoteEntry(entry);
  if (parsed == null) {
    throw new Error("invalid_payload");
  }
  const trainerId = await requireTrainerId();
  const db = getDb();
  await assertCoreProductWriteAllowed(db, trainerId);
  await dbAddNoteEntry(db, trainerId, parsed);
  revalidateTrainlyClientPaths(parsed.clientId);
}

export async function trainlyMarkScheduleMissedAction(scheduleItemId: string): Promise<void> {
  const trainerId = await requireTrainerId();
  const db = getDb();
  await assertCoreProductWriteAllowed(db, trainerId);
  await dbMarkScheduleMissed(db, trainerId, scheduleItemId);
  revalidateTrainlyCorePaths();
}

export async function trainlyMarkScheduleCancelledAction(scheduleItemId: string): Promise<void> {
  const trainerId = await requireTrainerId();
  const db = getDb();
  await assertCoreProductWriteAllowed(db, trainerId);
  await dbMarkScheduleCancelled(db, trainerId, scheduleItemId);
  revalidateTrainlyCorePaths();
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
  revalidateTrainlyCorePaths();
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
  revalidateTrainlyCorePaths();
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
  revalidateTrainlyCorePaths();
}

export async function trainlyCreateWorkoutTemplateAction(
  input: CreateWorkoutTemplateInput,
): Promise<{ ok: true; id: string } | { ok: false; errors: string[] }> {
  const trainerId = await requireTrainerId();
  const db = getDb();
  await assertCoreProductWriteAllowed(db, trainerId);
  const res = await dbCreateWorkoutTemplate(db, trainerId, input);
  revalidateTrainlyCorePaths();
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
  revalidateTrainlyCorePaths();
  return res;
}

export async function trainlyArchiveWorkoutTemplateAction(
  templateId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trainerId = await requireTrainerId();
  const db = getDb();
  await assertCoreProductWriteAllowed(db, trainerId);
  const res = await dbArchiveWorkoutTemplate(db, trainerId, templateId);
  revalidateTrainlyCorePaths();
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
  revalidateTrainlyCorePaths();
  return res;
}

export async function trainlyAcceptLegalAction(): Promise<void> {
  const trainerId = await requireTrainerId();
  const db = getDb();
  await dbAcceptLegal(db, trainerId);
  revalidateTrainlyCorePaths();
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
  revalidateTrainlyCorePaths();
}

export async function trainlyMarkOnboardingSeenAction(): Promise<void> {
  const trainerId = await requireTrainerId();
  const db = getDb();
  await dbMarkOnboardingSeen(db, trainerId);
  revalidateTrainlyCorePaths();
}

export async function trainlySetSubscriptionStatusAction(
  status: MockSubscriptionStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!canOverrideSubscriptionStatusInRuntime()) {
    return { ok: false, error: "Изменение подписки через приложение недоступно. Используйте оплату через ЮKassa." };
  }
  const trainerId = await requireTrainerId();
  const db = getDb();
  await dbSetSubscriptionStatus(db, trainerId, status);
  revalidateTrainlyBillingPaths();
  return { ok: true };
}

/**
 * Только development: cookie-сессия для фиктивного тренера (без Telegram).
 */
export async function enterDevTrainerSessionAction(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  if (process.env.NODE_ENV === "production") {
    return { ok: false, error: "Dev-вход недоступен в production." };
  }
  if (process.env.TRAINLY_DEV_AUTH_SECRET == null || process.env.TRAINLY_DEV_AUTH_SECRET.length === 0) {
    return { ok: false, error: "Задайте TRAINLY_DEV_AUTH_SECRET в .env.local" };
  }
  try {
    const db = getDb();
    const { trainerId, telegramUserId } = await ensureDevTrainerSessionReady(db);
    const token = await signSessionToken({
      trainerId,
      telegramUserId,
    });
    const jar = await cookies();
    jar.set(sessionCookieName(), token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    revalidateTrainlyCorePaths();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: formatPgErrorForUi(e) };
  }
}

export async function trainlyLogoutAction(): Promise<void> {
  const jar = await cookies();
  jar.delete(sessionCookieName());
}

export async function trainlySaveWorkoutDraftAction(payload: {
  workoutId: string;
  session: WorkoutSessionState;
  status: "draft" | "in_progress";
  templateId?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string; conflictWorkoutId?: string }> {
  const trainerId = await requireTrainerId();
  const db = getDb();
  await assertCoreProductWriteAllowed(db, trainerId);
  if (payload.workoutId.length === 0 || payload.session.clientId.length === 0) {
    return { ok: false, error: "Некорректные данные черновика." };
  }
  try {
    await dbUpsertActiveWorkout(db, trainerId, payload);
    revalidateTrainlyCorePaths();
    return { ok: true };
  } catch (e) {
    if (e instanceof ActiveWorkoutConflictError) {
      return { ok: false, error: "У клиента уже есть незавершённая тренировка.", conflictWorkoutId: e.existingWorkoutId };
    }
    throw e;
  }
}

export async function trainlyLoadWorkoutDraftAction(
  clientId: string,
): Promise<(PersistedWorkoutDraft & { clientName: string }) | null> {
  const trainerId = await requireTrainerId();
  const db = getDb();
  const draft = await dbLoadActiveWorkout(db, trainerId, clientId);
  if (draft == null) return null;
  const clientRows = await db
    .select({ name: clients.name })
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.trainerId, trainerId)))
    .limit(1);
  const clientName = clientRows[0]?.name ?? "Клиент";
  return { ...draft, session: { ...draft.session, clientName }, clientName };
}

export async function trainlyDiscardWorkoutDraftAction(workoutId: string): Promise<void> {
  const trainerId = await requireTrainerId();
  const db = getDb();
  await dbDeleteActiveWorkout(db, trainerId, workoutId);
  revalidateTrainlyCorePaths();
}

export async function trainlyUpdateJournalWorkoutAction(
  workoutId: string,
  input: JournalWorkoutUpdateInput,
): Promise<{ ok: true } | { ok: false; errors: string[] }> {
  const errors = validateJournalWorkoutUpdate(input);
  if (errors.length > 0) return { ok: false, errors };
  const trainerId = await requireTrainerId();
  const db = getDb();
  await assertCoreProductWriteAllowed(db, trainerId);
  const res = await dbUpdateJournalWorkout(db, trainerId, workoutId, input);
  if (res.ok) revalidateTrainlyClientPaths();
  return res;
}

export async function trainlyUpdateJournalNoteAction(
  workoutId: string,
  input: JournalNoteUpdateInput,
): Promise<{ ok: true } | { ok: false; errors: string[] }> {
  const errors = validateJournalNoteUpdate(input);
  if (errors.length > 0) return { ok: false, errors };
  const trainerId = await requireTrainerId();
  const db = getDb();
  await assertCoreProductWriteAllowed(db, trainerId);
  const res = await dbUpdateJournalNote(db, trainerId, workoutId, input);
  if (res.ok) revalidateTrainlyClientPaths();
  return res;
}

export async function trainlyDeleteAccountAction(
  confirmPhrase: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (confirmPhrase.trim() !== "УДАЛИТЬ") {
    return { ok: false, error: 'Введите слово «УДАЛИТЬ» для подтверждения.' };
  }
  const trainerId = await requireTrainerId();
  const db = getDb();
  await dbDeleteTrainerAccount(db, trainerId);
  await trainlyLogoutAction();
  return { ok: true };
}
