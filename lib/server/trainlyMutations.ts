import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import {
  clientSessionPayments,
  clients,
  coachQuickNotes,
  scheduleItems,
  trainerAccessEvents,
  trainerLegalAcceptances,
  trainerProductAccess,
  trainers,
  workoutExercises,
  workoutSets,
  workoutTemplateExercises,
  workoutTemplates,
  workouts,
} from "@/db/schema";
import { recomputeJournalWorkoutStats } from "@/lib/journal/journalEntryStats";
import type {
  JournalNoteUpdateInput,
  JournalWorkoutUpdateInput,
} from "@/lib/journal/validateJournalUpdate";
import type { JournalCompletedWorkout, JournalNoteEntry } from "@/lib/types";
import { dbReplaceWorkoutStructure } from "@/lib/server/workoutDrafts";
import type { CoachQuickNoteType } from "@/lib/mock/coachLedger";
import { spendOneClientSessionBalance } from "@/lib/coach/paidSessions";
import {
  TRAINLY_REQUIRED_LEGAL_DOC_CODES,
  TRAINLY_REQUIRED_LEGAL_VERSION,
} from "@/lib/legal/requiredDocuments";
import {
  normalizeTemplateName,
  validateTemplateInput,
  validateUpdateWorkoutTemplateInput,
  type CreateWorkoutTemplateInput,
  type UpdateWorkoutTemplateInput,
} from "@/lib/workout/templates";
import type { MockSubscriptionStatus } from "@/lib/mock/lifecycleTypes";
import { workoutExerciseIdForPostgres } from "@/lib/workout/ids";
import { canTrainerAddClient, TrainlyClientLimitError } from "@/lib/billing/planLimits";
import { parseTrainerProductAccessStatus } from "@/lib/billing/accessGate";

async function assertClientOwned(
  db: AppDatabase,
  trainerId: string,
  clientId: string,
): Promise<void> {
  const rows = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.trainerId, trainerId), eq(clients.id, clientId)))
    .limit(1);
  if (rows.length === 0) {
    throw new Error("client_not_found");
  }
}

function toPgTime(hhmm: string): string {
  const t = hhmm.trim();
  if (t.length === 5 && t[2] === ":") return `${t}:00`;
  if (t.length >= 8) return t.slice(0, 8);
  return `${t}:00`;
}

export async function dbAddClient(
  db: AppDatabase,
  trainerId: string,
  payload: { name: string; goal?: string; remainingSessions?: number; limitation?: string },
): Promise<string> {
  const [accessRow] = await db
    .select({
      accessStatus: trainerProductAccess.accessStatus,
      planCode: trainerProductAccess.planCode,
    })
    .from(trainerProductAccess)
    .where(eq(trainerProductAccess.trainerId, trainerId))
    .limit(1);
  const accessStatus = parseTrainerProductAccessStatus(accessRow?.accessStatus ?? "demo_unlimited");
  const activeRows = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.trainerId, trainerId), eq(clients.lifecycle, "active")));
  const limitCheck = canTrainerAddClient({
    accessStatus,
    planCode: accessRow?.planCode ?? null,
    activeClientCount: activeRows.length,
  });
  if (!limitCheck.ok) {
    throw new TrainlyClientLimitError(limitCheck.limit);
  }

  const inserted = await db
    .insert(clients)
    .values({
      trainerId,
      name: payload.name.trim(),
      goal: payload.goal?.trim() || null,
      limitation: payload.limitation?.trim() || null,
      remainingSessions: payload.remainingSessions ?? 0,
    })
    .returning({ id: clients.id });
  const row = inserted[0];
  if (row == null) throw new Error("client_insert_failed");
  return row.id;
}

export async function dbAddCompletedWorkout(
  db: AppDatabase,
  trainerId: string,
  entry: JournalCompletedWorkout,
): Promise<void> {
  await assertClientOwned(db, trainerId, entry.clientId);
  await db.transaction(async (tx) => {
    await tx
      .delete(workouts)
      .where(
        and(
          eq(workouts.trainerId, trainerId),
          eq(workouts.clientId, entry.clientId),
          inArray(workouts.status, ["draft", "in_progress"]),
        ),
      );

    let linkedScheduleId: string | null = entry.scheduleItemId ?? null;
    if (linkedScheduleId != null) {
      const slotRows = await tx
        .select({ id: scheduleItems.id })
        .from(scheduleItems)
        .where(
          and(
            eq(scheduleItems.id, linkedScheduleId),
            eq(scheduleItems.trainerId, trainerId),
            eq(scheduleItems.clientId, entry.clientId),
            inArray(scheduleItems.status, ["planned", "upcoming"]),
          ),
        )
        .limit(1);
      if (slotRows.length === 0) {
        linkedScheduleId = null;
      }
    }

    await tx.insert(workouts).values({
      id: entry.id,
      trainerId,
      clientId: entry.clientId,
      scheduleItemId: linkedScheduleId,
      templateId: null,
      status: "completed",
      title: entry.title,
      workoutComment: entry.workoutComment,
      startedAt: new Date(entry.createdAtMs),
      completedAt: new Date(entry.createdAtMs),
      durationMinutes: entry.durationMin,
      filledSetCount: entry.filledSetCount,
      volumeKg: entry.volumeKg != null ? String(entry.volumeKg) : null,
      summaryHint: entry.summaryHint,
      debtAcknowledged: false,
    });

    for (let i = 0; i < entry.exercises.length; i++) {
      const ex = entry.exercises[i];
      const exerciseRowId = workoutExerciseIdForPostgres(ex.id);
      await tx.insert(workoutExercises).values({
        id: exerciseRowId,
        trainerId,
        workoutId: entry.id,
        orderIndex: i,
        name: ex.name,
        comment: ex.comment,
        skipped: ex.skipped,
      });
      for (const set of ex.sets) {
        await tx.insert(workoutSets).values({
          id: set.id,
          trainerId,
          workoutExerciseId: exerciseRowId,
          setType: set.setType,
          weight: set.weight,
          reps: set.reps,
          durationSec: set.durationSec,
          comment: set.comment,
          done: set.done,
          isDrop: set.isDrop,
          parentSetId: set.parentSetId,
        });
      }
    }

    const cur = await tx
      .select({ remainingSessions: clients.remainingSessions })
      .from(clients)
      .where(eq(clients.id, entry.clientId))
      .limit(1);
    const rem = cur[0]?.remainingSessions ?? 0;
    const next = spendOneClientSessionBalance(rem);
    await tx
      .update(clients)
      .set({ remainingSessions: next, updatedAt: new Date() })
      .where(and(eq(clients.id, entry.clientId), eq(clients.trainerId, trainerId)));

    if (linkedScheduleId != null) {
      await tx
        .update(scheduleItems)
        .set({ status: "completed", updatedAt: new Date() })
        .where(
          and(
            eq(scheduleItems.id, linkedScheduleId),
            eq(scheduleItems.trainerId, trainerId),
            inArray(scheduleItems.status, ["planned", "upcoming"]),
          ),
        );
    }
  });
}

export async function dbAddNoteEntry(db: AppDatabase, trainerId: string, entry: JournalNoteEntry): Promise<void> {
  await assertClientOwned(db, trainerId, entry.clientId);
  await db.transaction(async (tx) => {
    await tx
      .delete(workouts)
      .where(
        and(
          eq(workouts.trainerId, trainerId),
          eq(workouts.clientId, entry.clientId),
          inArray(workouts.status, ["draft", "in_progress"]),
        ),
      );

    let linkedScheduleId: string | null = entry.scheduleItemId ?? null;
    if (linkedScheduleId != null) {
      const slotRows = await tx
        .select({ id: scheduleItems.id })
        .from(scheduleItems)
        .where(
          and(
            eq(scheduleItems.id, linkedScheduleId),
            eq(scheduleItems.trainerId, trainerId),
            eq(scheduleItems.clientId, entry.clientId),
            inArray(scheduleItems.status, ["planned", "upcoming"]),
          ),
        )
        .limit(1);
      if (slotRows.length === 0) {
        linkedScheduleId = null;
      }
    }

    await tx.insert(workouts).values({
      id: entry.id,
      trainerId,
      clientId: entry.clientId,
      scheduleItemId: linkedScheduleId,
      templateId: null,
      status: "completed_as_note",
      title: entry.title,
      workoutComment: entry.workoutComment,
      startedAt: new Date(entry.createdAtMs),
      completedAt: new Date(entry.createdAtMs),
      durationMinutes: entry.durationMin,
      filledSetCount: 0,
      volumeKg: null,
      summaryHint: null,
      debtAcknowledged: false,
    });

    if (linkedScheduleId != null) {
      await tx
        .update(scheduleItems)
        .set({ status: "completed", updatedAt: new Date() })
        .where(
          and(
            eq(scheduleItems.id, linkedScheduleId),
            eq(scheduleItems.trainerId, trainerId),
            inArray(scheduleItems.status, ["planned", "upcoming"]),
          ),
        );
    }
  });
}

export async function dbDeleteTrainerAccount(db: AppDatabase, trainerId: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.insert(trainerAccessEvents).values({
      trainerId,
      eventKind: "account_deleted",
      accessStatus: null,
      source: "trainly_delete_account",
    });
    await tx.delete(trainers).where(eq(trainers.id, trainerId));
  });
}

export async function dbMarkScheduleMissed(
  db: AppDatabase,
  trainerId: string,
  scheduleItemId: string,
): Promise<void> {
  await db
    .update(scheduleItems)
    .set({ status: "missed", updatedAt: new Date() })
    .where(
      and(
        eq(scheduleItems.id, scheduleItemId),
        eq(scheduleItems.trainerId, trainerId),
        inArray(scheduleItems.status, ["planned", "upcoming"]),
      ),
    );
}

export async function dbMarkScheduleCancelled(
  db: AppDatabase,
  trainerId: string,
  scheduleItemId: string,
): Promise<void> {
  await db
    .update(scheduleItems)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(
      and(
        eq(scheduleItems.id, scheduleItemId),
        eq(scheduleItems.trainerId, trainerId),
        inArray(scheduleItems.status, ["planned", "upcoming"]),
      ),
    );
}

export async function dbAddScheduleSlot(
  db: AppDatabase,
  trainerId: string,
  payload: {
    clientId: string;
    dateIso: string;
    time: string;
    title: string;
    durationMinutes: number;
    templateId?: string;
  },
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  await assertClientOwned(db, trainerId, payload.clientId);
  const duration = Math.max(15, Math.min(240, Math.round(payload.durationMinutes)));
  let templateName: string | undefined;
  if (payload.templateId != null) {
    const tpl = await db
      .select({ name: workoutTemplates.name, clientId: workoutTemplates.clientId, archivedAt: workoutTemplates.archivedAt })
      .from(workoutTemplates)
      .where(and(eq(workoutTemplates.id, payload.templateId), eq(workoutTemplates.trainerId, trainerId)))
      .limit(1);
    const t = tpl[0];
    if (t == null || t.clientId !== payload.clientId || t.archivedAt != null) {
      return { ok: false, error: "Шаблон недоступен для этого клиента." };
    }
    templateName = t.name;
  }
  const inserted = await db
    .insert(scheduleItems)
    .values({
      trainerId,
      clientId: payload.clientId,
      scheduledDate: payload.dateIso,
      scheduledTime: toPgTime(payload.time),
      durationMinutes: duration,
      title: payload.title.trim() || "Тренировка",
      status: "planned",
      templateId: payload.templateId ?? null,
      templateNameSnapshot: templateName ?? null,
    })
    .returning({ id: scheduleItems.id });
  const id = inserted[0]?.id;
  if (id == null) return { ok: false, error: "Не удалось создать запись." };
  return { ok: true, id };
}

export async function dbRecordCoachPayment(
  db: AppDatabase,
  trainerId: string,
  payload: {
    clientId: string;
    sessionsAdded: number;
    amountRub: number | null;
    comment: string | null;
  },
): Promise<void> {
  await assertClientOwned(db, trainerId, payload.clientId);
  if (!Number.isFinite(payload.sessionsAdded) || payload.sessionsAdded < 1) {
    throw new Error("sessions_added_invalid");
  }
  const sessionsAdded = Math.floor(payload.sessionsAdded);
  await db.transaction(async (tx) => {
    await tx.insert(clientSessionPayments).values({
      trainerId,
      clientId: payload.clientId,
      sessionsAdded,
      amountRub: payload.amountRub,
      comment: payload.comment,
    });
    const cur = await tx
      .select({ remainingSessions: clients.remainingSessions })
      .from(clients)
      .where(eq(clients.id, payload.clientId))
      .limit(1);
    const rem = cur[0]?.remainingSessions ?? 0;
    await tx
      .update(clients)
      .set({
        remainingSessions: rem + sessionsAdded,
        updatedAt: new Date(),
      })
      .where(and(eq(clients.id, payload.clientId), eq(clients.trainerId, trainerId)));
  });
}

export async function dbAddCoachQuickNote(
  db: AppDatabase,
  trainerId: string,
  payload: { clientId: string | null; type: CoachQuickNoteType; text: string },
): Promise<void> {
  if (payload.clientId != null) {
    await assertClientOwned(db, trainerId, payload.clientId);
  }
  await db.insert(coachQuickNotes).values({
    trainerId,
    clientId: payload.clientId,
    noteType: payload.type,
    body: payload.text.trim(),
  });
}

export async function dbCreateWorkoutTemplate(
  db: AppDatabase,
  trainerId: string,
  input: CreateWorkoutTemplateInput,
): Promise<{ ok: true; id: string } | { ok: false; errors: string[] }> {
  const errors = validateTemplateInput(input);
  if (errors.length > 0) return { ok: false, errors };
  await assertClientOwned(db, trainerId, input.clientId);
  const normalizedName = normalizeTemplateName(input.name);

  return db.transaction(async (tx) => {
    const taken = await tx
      .select({ id: workoutTemplates.id })
      .from(workoutTemplates)
      .where(
        and(
          eq(workoutTemplates.trainerId, trainerId),
          eq(workoutTemplates.clientId, input.clientId),
          eq(workoutTemplates.name, normalizedName),
          isNull(workoutTemplates.archivedAt),
        ),
      )
      .limit(1);
    if (taken.length > 0) {
      return { ok: false, errors: ["У этого клиента уже есть шаблон с таким названием."] };
    }

    const insertedTpl = await tx
      .insert(workoutTemplates)
      .values({
        trainerId,
        clientId: input.clientId,
        name: normalizedName,
        description: input.description?.trim() || null,
      })
      .returning({ id: workoutTemplates.id });
    const tplId = insertedTpl[0]?.id;
    if (tplId == null) return { ok: false, errors: ["Не удалось создать шаблон."] };

    for (let i = 0; i < input.exercises.length; i++) {
      const row = input.exercises[i];
      await tx.insert(workoutTemplateExercises).values({
        trainerId,
        templateId: tplId,
        orderIndex: i,
        name: normalizeTemplateName(row.name),
        plannedSets: row.plannedSets ?? null,
        comment: row.comment?.trim() || null,
      });
    }
    return { ok: true, id: tplId };
  });
}

export async function dbUpdateWorkoutTemplate(
  db: AppDatabase,
  trainerId: string,
  templateId: string,
  input: UpdateWorkoutTemplateInput,
): Promise<{ ok: true } | { ok: false; errors: string[] }> {
  const partialErrors = validateUpdateWorkoutTemplateInput(input);
  if (partialErrors.length > 0) return { ok: false, errors: partialErrors };

  const curRows = await db
    .select()
    .from(workoutTemplates)
    .where(and(eq(workoutTemplates.id, templateId), eq(workoutTemplates.trainerId, trainerId)))
    .limit(1);
  const cur = curRows[0];
  if (cur == null || cur.archivedAt != null) return { ok: false, errors: ["Шаблон не найден."] };

  const mergedName = input.name !== undefined ? normalizeTemplateName(input.name) : cur.name;
  if (input.name !== undefined) {
    const taken = await db
      .select({ id: workoutTemplates.id })
      .from(workoutTemplates)
      .where(
        and(
          eq(workoutTemplates.trainerId, trainerId),
          eq(workoutTemplates.clientId, cur.clientId),
          eq(workoutTemplates.name, mergedName),
          isNull(workoutTemplates.archivedAt),
        ),
      )
      .limit(2);
    const other = taken.find((t) => t.id !== templateId);
    if (other != null) {
      return { ok: false, errors: ["У этого клиента уже есть шаблон с таким названием."] };
    }
  }

  await db
    .update(workoutTemplates)
    .set({
      name: mergedName,
      description: input.description !== undefined ? input.description.trim() || null : cur.description,
      updatedAt: new Date(),
    })
    .where(eq(workoutTemplates.id, templateId));

  if (input.exercises !== undefined) {
    await db
      .delete(workoutTemplateExercises)
      .where(
        and(eq(workoutTemplateExercises.templateId, templateId), eq(workoutTemplateExercises.trainerId, trainerId)),
      );
    for (let i = 0; i < input.exercises.length; i++) {
      const row = input.exercises[i];
      await db.insert(workoutTemplateExercises).values({
        trainerId,
        templateId,
        orderIndex: i,
        name: normalizeTemplateName(row.name),
        plannedSets: row.plannedSets ?? null,
        comment: row.comment?.trim() || null,
      });
    }
  }
  return { ok: true };
}

export async function dbArchiveWorkoutTemplate(
  db: AppDatabase,
  trainerId: string,
  templateId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const curRows = await db
    .select({ archivedAt: workoutTemplates.archivedAt })
    .from(workoutTemplates)
    .where(and(eq(workoutTemplates.id, templateId), eq(workoutTemplates.trainerId, trainerId)))
    .limit(1);
  const cur = curRows[0];
  if (cur == null) return { ok: false, error: "Шаблон не найден." };
  if (cur.archivedAt != null) return { ok: false, error: "Шаблон уже в архиве." };
  await db
    .update(workoutTemplates)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(eq(workoutTemplates.id, templateId));
  return { ok: true };
}

export async function dbSaveWorkoutAsTemplateFromJournal(
  db: AppDatabase,
  trainerId: string,
  params: { workoutId: string; name: string },
): Promise<{ ok: true; id: string } | { ok: false; errors: string[] }> {
  const wRows = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.id, params.workoutId), eq(workouts.trainerId, trainerId)))
    .limit(1);
  const w = wRows[0];
  if (w == null || w.status !== "completed") {
    return { ok: false, errors: ["Запись не найдена или это не тренировка."] };
  }
  const exRows = await db
    .select()
    .from(workoutExercises)
    .where(eq(workoutExercises.workoutId, params.workoutId))
    .orderBy(asc(workoutExercises.orderIndex));
  if (exRows.length === 0) {
    return { ok: false, errors: ["Нет упражнений для сохранения в шаблон."] };
  }
  const exercises: CreateWorkoutTemplateInput["exercises"] = [];
  for (const ex of exRows) {
    const setCountRows = await db
      .select({ c: workoutSets.id })
      .from(workoutSets)
      .where(eq(workoutSets.workoutExerciseId, ex.id));
    const rowCount = setCountRows.length;
    const nm = normalizeTemplateName(ex.name);
    if (nm.length === 0) {
      if (rowCount > 0) {
        return { ok: false, errors: ["В тренировке есть упражнение без названия."] };
      }
      continue;
    }
    exercises.push({
      name: nm,
      plannedSets: Math.min(Math.max(rowCount, 1), 20),
      comment: ex.comment?.trim() || undefined,
    });
  }
  if (exercises.length === 0) {
    return { ok: false, errors: ["Нет упражнений с названием для шаблона."] };
  }
  return dbCreateWorkoutTemplate(db, trainerId, {
    clientId: w.clientId,
    name: params.name,
    exercises,
  });
}

export async function dbAcceptLegal(db: AppDatabase, trainerId: string): Promise<void> {
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(trainers)
      .set({ legalAcceptedAt: now, updatedAt: now })
      .where(eq(trainers.id, trainerId));
    for (const documentCode of TRAINLY_REQUIRED_LEGAL_DOC_CODES) {
      await tx
        .insert(trainerLegalAcceptances)
        .values({
          trainerId,
          documentCode,
          version: TRAINLY_REQUIRED_LEGAL_VERSION,
          acceptedAt: now,
        })
        .onConflictDoNothing({
          target: [
            trainerLegalAcceptances.trainerId,
            trainerLegalAcceptances.documentCode,
            trainerLegalAcceptances.version,
          ],
        });
    }
  });
}

export async function dbCompleteProfileSetup(
  db: AppDatabase,
  trainerId: string,
  input: { displayName: string; specialization?: string; city?: string; timezone: string },
): Promise<void> {
  await db
    .update(trainers)
    .set({
      displayName: input.displayName.trim(),
      specialization: input.specialization?.trim() || null,
      city: input.city?.trim() || null,
      timezone: input.timezone,
      updatedAt: new Date(),
    })
    .where(eq(trainers.id, trainerId));
}

export async function dbMarkOnboardingSeen(db: AppDatabase, trainerId: string): Promise<void> {
  await db
    .update(trainers)
    .set({ onboardingSeenAt: new Date(), updatedAt: new Date() })
    .where(eq(trainers.id, trainerId));
}

export async function dbSetSubscriptionStatus(
  db: AppDatabase,
  trainerId: string,
  status: MockSubscriptionStatus,
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .insert(trainerProductAccess)
      .values({ trainerId, accessStatus: status })
      .onConflictDoUpdate({
        target: trainerProductAccess.trainerId,
        set: { accessStatus: status, updatedAt: new Date() },
      });
    await tx.insert(trainerAccessEvents).values({
      trainerId,
      eventKind: "access_status_set",
      accessStatus: status,
      source: "trainly_set_subscription",
    });
  });
}

export async function dbUpdateJournalWorkout(
  db: AppDatabase,
  trainerId: string,
  workoutId: string,
  input: JournalWorkoutUpdateInput,
): Promise<{ ok: true } | { ok: false; errors: string[] }> {
  const wRows = await db
    .select({ id: workouts.id, status: workouts.status, clientId: workouts.clientId })
    .from(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.trainerId, trainerId)))
    .limit(1);
  const w = wRows[0];
  if (w == null || w.status !== "completed") {
    return { ok: false, errors: ["Запись не найдена."] };
  }

  const stats = recomputeJournalWorkoutStats(input.exercises);
  await db.transaction(async (tx) => {
    await tx
      .update(workouts)
      .set({
        title: input.title.trim(),
        workoutComment: input.workoutComment,
        durationMinutes: Math.max(1, Math.round(input.durationMin)),
        filledSetCount: stats.filledSetCount,
        volumeKg: stats.volumeKg != null ? String(stats.volumeKg) : null,
        summaryHint: stats.summaryHint,
        updatedAt: new Date(),
      })
      .where(and(eq(workouts.id, workoutId), eq(workouts.trainerId, trainerId)));
    await dbReplaceWorkoutStructure(tx, trainerId, workoutId, input.exercises);
  });
  return { ok: true };
}

export async function dbUpdateJournalNote(
  db: AppDatabase,
  trainerId: string,
  workoutId: string,
  input: JournalNoteUpdateInput,
): Promise<{ ok: true } | { ok: false; errors: string[] }> {
  const wRows = await db
    .select({ id: workouts.id, status: workouts.status })
    .from(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.trainerId, trainerId)))
    .limit(1);
  const w = wRows[0];
  if (w == null || w.status !== "completed_as_note") {
    return { ok: false, errors: ["Запись не найдена."] };
  }

  await db
    .update(workouts)
    .set({
      title: input.title.trim(),
      workoutComment: input.workoutComment,
      durationMinutes: Math.max(1, Math.round(input.durationMin)),
      updatedAt: new Date(),
    })
    .where(and(eq(workouts.id, workoutId), eq(workouts.trainerId, trainerId)));
  return { ok: true };
}
