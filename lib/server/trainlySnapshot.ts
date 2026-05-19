import { and, asc, desc, eq, inArray } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import {
  clientSessionPayments,
  clients,
  coachQuickNotes,
  scheduleItems,
  trainerLegalAcceptances,
  trainerProductAccess,
  trainers,
  workoutExercises,
  workoutSets,
  workoutTemplateExercises,
  workoutTemplates as workoutTemplatesTable,
  workouts,
} from "@/db/schema";
import {
  TRAINLY_REQUIRED_LEGAL_DOC_CODES,
  trainerHasRequiredLegalAcceptances,
} from "@/lib/legal/requiredDocuments";
import { parseTrainerProductAccessStatus } from "@/lib/billing/accessGate";
import type { TrainlySnapshot } from "@/lib/trainly/snapshotTypes";
import type { MockClient, MockScheduleItem } from "@/lib/mock/data";
import type { CoachPaymentRecord, CoachQuickNote } from "@/lib/mock/coachLedger";
import type { JournalCompletedWorkout, JournalEntry, JournalNoteEntry } from "@/lib/types";
import type { WorkoutExercise, WorkoutSetRow } from "@/lib/workout/types";
import type { WorkoutTemplate, WorkoutTemplateExercise } from "@/lib/workout/templates";
import type { MockLifecyclePersisted, MockSubscriptionStatus } from "@/lib/mock/lifecycleTypes";
import { formatOverviewHumanDate, isoDayLocal } from "@/lib/overview/dailyOperations";
import { nextPendingSlotForClient } from "@/lib/clients/clientAttention";

const TRAINLY_DEV_TELEGRAM_USER_ID = BigInt("9000000000000");
const JOURNAL_LOAD_LIMIT = 200;

function todayIsoInTrainerTz(timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone.length > 0 ? timezone : "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatTimeForUi(t: string): string {
  if (t.length >= 5) return t.slice(0, 5);
  return t;
}

function calendarDaysBetweenIso(fromIso: string, toIso: string): number {
  const a = Date.parse(`${fromIso}T00:00:00`);
  const b = Date.parse(`${toIso}T00:00:00`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

function mapSets(rows: (typeof workoutSets.$inferSelect)[]): WorkoutSetRow[] {
  return rows.map((r) => ({
    id: r.id,
    setType: r.setType,
    weight: r.weight,
    reps: r.reps,
    durationSec: r.durationSec,
    comment: r.comment,
    done: r.done,
    isDrop: r.isDrop,
    parentSetId: r.parentSetId,
  }));
}

function mapExercises(
  exercises: (typeof workoutExercises.$inferSelect)[],
  setsByExerciseId: Map<string, (typeof workoutSets.$inferSelect)[]>,
): WorkoutExercise[] {
  const sorted = [...exercises].sort((a, b) => a.orderIndex - b.orderIndex);
  return sorted.map((ex) => ({
    id: ex.id,
    name: ex.name,
    comment: ex.comment,
    skipped: ex.skipped,
    sets: mapSets(setsByExerciseId.get(ex.id) ?? []),
  }));
}

function buildLifecycle(
  trainer: typeof trainers.$inferSelect,
  access: typeof trainerProductAccess.$inferSelect | undefined,
  requiredLegalComplete: boolean,
): MockLifecyclePersisted {
  const st =
    access?.accessStatus != null ? parseTrainerProductAccessStatus(access.accessStatus) : "demo_unlimited";
  const authStatus: "authenticated" | "authenticated_demo" =
    trainer.telegramUserId != null && trainer.telegramUserId !== TRAINLY_DEV_TELEGRAM_USER_ID
      ? "authenticated"
      : "authenticated_demo";

  return {
    v: 1,
    mockAuthStatus: authStatus,
    mockLegalStatus: requiredLegalComplete ? "accepted" : "not_accepted",
    mockProfileSetupStatus: trainer.displayName.trim().length > 0 ? "completed" : "not_completed",
    mockOnboardingStatus: trainer.onboardingSeenAt != null ? "seen" : "not_seen",
    mockSubscriptionStatus: st as MockSubscriptionStatus,
    trainerProfile:
      trainer.displayName.trim().length > 0
        ? {
            displayName: trainer.displayName.trim(),
            specialization: trainer.specialization ?? undefined,
            city: trainer.city ?? undefined,
            timezone: trainer.timezone,
            currency: "₽",
          }
        : null,
  };
}

export async function loadTrainlySnapshot(db: AppDatabase, trainerId: string): Promise<TrainlySnapshot> {
  const trainerRows = await db.select().from(trainers).where(eq(trainers.id, trainerId)).limit(1);
  const trainer = trainerRows[0];
  if (trainer == null) {
    throw new Error("trainer_not_found");
  }

  const [accessRows, legalRows, clientRows] = await Promise.all([
    db
      .select()
      .from(trainerProductAccess)
      .where(eq(trainerProductAccess.trainerId, trainerId))
      .limit(1),
    db
      .select({
        documentCode: trainerLegalAcceptances.documentCode,
        version: trainerLegalAcceptances.version,
      })
      .from(trainerLegalAcceptances)
      .where(
        and(
          eq(trainerLegalAcceptances.trainerId, trainerId),
          inArray(trainerLegalAcceptances.documentCode, [...TRAINLY_REQUIRED_LEGAL_DOC_CODES]),
        ),
      ),
    db.select().from(clients).where(eq(clients.trainerId, trainerId)),
  ]);
  const access = accessRows[0];

  const requiredLegalComplete = trainerHasRequiredLegalAcceptances(
    legalRows,
    trainer.legalAcceptedAt,
  );

  const todayIso = todayIsoInTrainerTz(trainer.timezone);
  const nameByClient = new Map(clientRows.map((c) => [c.id, c.name]));

  const [
    { workoutRows, exerciseRows, setRows, journalHasMore },
    activeDraftRows,
    scheduleRows,
    paymentRows,
    noteRows,
    { tplRows, tplExRows },
  ] = await Promise.all([
    (async (): Promise<{
      workoutRows: (typeof workouts.$inferSelect)[];
      exerciseRows: (typeof workoutExercises.$inferSelect)[];
      setRows: (typeof workoutSets.$inferSelect)[];
      journalHasMore: boolean;
    }> => {
      const wr = await db
        .select()
        .from(workouts)
        .where(
          and(
            eq(workouts.trainerId, trainerId),
            inArray(workouts.status, ["completed", "completed_as_note"]),
          ),
        )
        .orderBy(desc(workouts.completedAt), desc(workouts.startedAt))
        .limit(JOURNAL_LOAD_LIMIT + 1);
      const journalHasMore = wr.length > JOURNAL_LOAD_LIMIT;
      const journalRows = journalHasMore ? wr.slice(0, JOURNAL_LOAD_LIMIT) : wr;
      const workoutIds = journalRows.map((w) => w.id);
      const ex =
        workoutIds.length === 0
          ? []
          : await db
              .select()
              .from(workoutExercises)
              .where(inArray(workoutExercises.workoutId, workoutIds))
              .orderBy(asc(workoutExercises.orderIndex));
      const exerciseIds = ex.map((e) => e.id);
      const sr =
        exerciseIds.length === 0
          ? []
          : await db.select().from(workoutSets).where(inArray(workoutSets.workoutExerciseId, exerciseIds));
      return { workoutRows: journalRows, exerciseRows: ex, setRows: sr, journalHasMore };
    })(),
    db
      .select({
        id: workouts.id,
        clientId: workouts.clientId,
        title: workouts.title,
        startedAt: workouts.startedAt,
      })
      .from(workouts)
      .where(
        and(
          eq(workouts.trainerId, trainerId),
          inArray(workouts.status, ["draft", "in_progress"]),
        ),
      ),
    db
      .select()
      .from(scheduleItems)
      .where(eq(scheduleItems.trainerId, trainerId))
      .orderBy(asc(scheduleItems.scheduledDate), asc(scheduleItems.scheduledTime)),
    db
      .select()
      .from(clientSessionPayments)
      .where(eq(clientSessionPayments.trainerId, trainerId))
      .orderBy(desc(clientSessionPayments.createdAt))
      .limit(500),
    db
      .select()
      .from(coachQuickNotes)
      .where(eq(coachQuickNotes.trainerId, trainerId))
      .orderBy(desc(coachQuickNotes.createdAt))
      .limit(500),
    (async (): Promise<{
      tplRows: (typeof workoutTemplatesTable.$inferSelect)[];
      tplExRows: (typeof workoutTemplateExercises.$inferSelect)[];
    }> => {
      const tr = await db
        .select()
        .from(workoutTemplatesTable)
        .where(eq(workoutTemplatesTable.trainerId, trainerId));
      const tplIds = tr.map((t) => t.id);
      const ter =
        tplIds.length === 0
          ? []
          : await db
              .select()
              .from(workoutTemplateExercises)
              .where(inArray(workoutTemplateExercises.templateId, tplIds))
              .orderBy(asc(workoutTemplateExercises.orderIndex));
      return { tplRows: tr, tplExRows: ter };
    })(),
  ]);

  const setsByExercise = new Map<string, (typeof workoutSets.$inferSelect)[]>();
  for (const s of setRows) {
    const list = setsByExercise.get(s.workoutExerciseId) ?? [];
    list.push(s);
    setsByExercise.set(s.workoutExerciseId, list);
  }

  const exercisesByWorkout = new Map<string, (typeof workoutExercises.$inferSelect)[]>();
  for (const ex of exerciseRows) {
    const list = exercisesByWorkout.get(ex.workoutId) ?? [];
    list.push(ex);
    exercisesByWorkout.set(ex.workoutId, list);
  }

  const completedByScheduleId = new Map<string, string>();
  for (const w of workoutRows) {
    if (
      (w.status === "completed" || w.status === "completed_as_note") &&
      w.scheduleItemId != null &&
      w.scheduleItemId.length > 0
    ) {
      completedByScheduleId.set(w.scheduleItemId, w.id);
    }
  }

  const journalEntries: JournalEntry[] = [];
  for (const w of workoutRows) {
    if (w.status !== "completed" && w.status !== "completed_as_note") continue;
    const completedAt = w.completedAt;
    if (completedAt == null) continue;
    const createdAtMs = completedAt.getTime();
    const clientName = nameByClient.get(w.clientId) ?? "Клиент";

    if (w.status === "completed_as_note") {
      const note: JournalNoteEntry = {
        kind: "note",
        id: w.id,
        clientId: w.clientId,
        clientName,
        scheduleItemId: w.scheduleItemId ?? undefined,
        createdAtMs,
        durationMin: w.durationMinutes ?? 0,
        status: "completed_as_note",
        title: w.title,
        workoutComment: w.workoutComment,
      };
      journalEntries.push(note);
      continue;
    }

    const exList = exercisesByWorkout.get(w.id) ?? [];
    const exercises = mapExercises(exList, setsByExercise);
    const vol = w.volumeKg != null ? Number(w.volumeKg) : null;
    const entry: JournalCompletedWorkout = {
      kind: "workout",
      id: w.id,
      clientId: w.clientId,
      clientName,
      scheduleItemId: w.scheduleItemId ?? undefined,
      createdAtMs,
      durationMin: w.durationMinutes ?? 0,
      status: "completed",
      title: w.title,
      exercises,
      workoutComment: w.workoutComment,
      filledSetCount: w.filledSetCount ?? 0,
      volumeKg: Number.isFinite(vol) ? vol : null,
      summaryHint: w.summaryHint ?? "",
    };
    journalEntries.push(entry);
  }

  journalEntries.sort((a, b) => b.createdAtMs - a.createdAtMs);

  const scheduleItemsMapped: MockScheduleItem[] = scheduleRows.map((s) => ({
    id: s.id,
    clientId: s.clientId,
    clientName: nameByClient.get(s.clientId) ?? "Клиент",
    date: s.scheduledDate,
    time: formatTimeForUi(String(s.scheduledTime)),
    durationMinutes: s.durationMinutes,
    title: s.title,
    status: s.status,
    workoutId: completedByScheduleId.get(s.id),
    templateId: s.templateId ?? undefined,
    templateName: s.templateNameSnapshot ?? undefined,
  }));

  const coachPaymentRecords: CoachPaymentRecord[] = paymentRows.map((p) => ({
    id: p.id,
    clientId: p.clientId,
    clientName: nameByClient.get(p.clientId) ?? "Клиент",
    sessionsAdded: p.sessionsAdded,
    amountRub: p.amountRub,
    comment: p.comment,
    createdAtMs: p.createdAt.getTime(),
  }));

  const coachQuickNotesMapped: CoachQuickNote[] = noteRows.map((n) => ({
    id: n.id,
    clientId: n.clientId ?? "",
    clientName: n.clientId ? (nameByClient.get(n.clientId) ?? "Клиент") : "",
    type: n.noteType,
    text: n.body,
    createdAtMs: n.createdAt.getTime(),
  }));

  const tplExByTpl = new Map<string, (typeof workoutTemplateExercises.$inferSelect)[]>();
  for (const r of tplExRows) {
    const list = tplExByTpl.get(r.templateId) ?? [];
    list.push(r);
    tplExByTpl.set(r.templateId, list);
  }

  const uiTemplates: WorkoutTemplate[] = tplRows.map((t) => {
    const ex: WorkoutTemplateExercise[] = (tplExByTpl.get(t.id) ?? []).map((e) => ({
      id: e.id,
      templateId: e.templateId,
      name: e.name,
      orderIndex: e.orderIndex,
      plannedSets: e.plannedSets ?? undefined,
      comment: e.comment ?? undefined,
    }));
    return {
      id: t.id,
      clientId: t.clientId,
      name: t.name,
      description: t.description ?? undefined,
      exercises: ex,
      createdAtIso: t.createdAt.toISOString().slice(0, 10),
      updatedAtIso: t.updatedAt.toISOString().slice(0, 10),
      archivedAtIso: t.archivedAt ? t.archivedAt.toISOString().slice(0, 10) : null,
    };
  });

  const paymentsByClient = new Map<string, (typeof clientSessionPayments.$inferSelect)[]>();
  for (const p of paymentRows) {
    const list = paymentsByClient.get(p.clientId) ?? [];
    list.push(p);
    paymentsByClient.set(p.clientId, list);
  }

  /** Только факты тренировок (`completed`), без заметок — для KPI и «последней тренировки». */
  const completedFactWorkoutsByClient = new Map<string, (typeof workouts.$inferSelect)[]>();
  for (const w of workoutRows) {
    if (w.status !== "completed") continue;
    const list = completedFactWorkoutsByClient.get(w.clientId) ?? [];
    list.push(w);
    completedFactWorkoutsByClient.set(w.clientId, list);
  }

  const enrichedClients: MockClient[] = clientRows.map((c) => {
    const list = (completedFactWorkoutsByClient.get(c.id) ?? []).sort(
      (a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0),
    );
    const last = list[0];
    const lastMs = last?.completedAt?.getTime() ?? null;
    const lastDayIso = lastMs != null ? isoDayLocal(lastMs) : null;
    const inactiveDays =
      lastDayIso != null ? calendarDaysBetweenIso(lastDayIso, todayIso) : last == null ? 999 : 0;

    const hasWorkoutToday = list.some(
      (w) => w.completedAt != null && isoDayLocal(w.completedAt.getTime()) === todayIso,
    );

    const nextSlot = nextPendingSlotForClient(scheduleItemsMapped, c.id, todayIso);
    const hasNextWorkoutScheduled = nextSlot != null;

    let lastWorkoutSummary: string | undefined;
    if (last != null && last.completedAt != null) {
      const rel = formatOverviewHumanDate(isoDayLocal(last.completedAt.getTime()), todayIso);
      lastWorkoutSummary = `${rel} · ${last.title}`;
    }

    const payList = (paymentsByClient.get(c.id) ?? []).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const lastPay = payList[0];
    let lastPaymentSummary: string | undefined;
    const paymentHistoryMock: { dateIso: string; label: string }[] = [];
    for (const p of payList.slice(0, 20)) {
      const dateIso = p.createdAt.toISOString().slice(0, 10);
      const parts: string[] = [`+${p.sessionsAdded} занятий`];
      if (p.amountRub != null) parts.push(`${p.amountRub} ₽`);
      if (p.comment?.trim()) parts.push(p.comment.trim());
      paymentHistoryMock.push({ dateIso, label: parts.join(" · ") });
    }
    if (lastPay != null) {
      const d = lastPay.createdAt.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
      const parts: string[] = [`+${lastPay.sessionsAdded} занятий`];
      if (lastPay.amountRub != null) parts.push(`${lastPay.amountRub} ₽`);
      lastPaymentSummary = `${d} · ${parts.join(" · ")}`;
    }

    return {
      id: c.id,
      name: c.name,
      goal: c.goal ?? undefined,
      remainingSessions: c.remainingSessions,
      limitation: c.limitation ?? undefined,
      lastWorkoutSummary,
      inactiveDays,
      hasWorkoutToday,
      hasNextWorkoutScheduled,
      completedWorkoutsCount: list.length,
      lastPaymentSummary,
      paymentHistoryMock: paymentHistoryMock.length > 0 ? paymentHistoryMock : undefined,
    };
  });

  const activeWorkoutDrafts = activeDraftRows.map((d) => ({
    workoutId: d.id,
    clientId: d.clientId,
    clientName: nameByClient.get(d.clientId) ?? "Клиент",
    title: d.title,
    startedAtMs: d.startedAt.getTime(),
  }));

  return {
    serverSnapshotRevision: Date.now(),
    todayIso,
    clients: enrichedClients,
    journalEntries,
    journalHasMore,
    activeWorkoutDrafts,
    scheduleItems: scheduleItemsMapped,
    coachPaymentRecords,
    coachQuickNotes: coachQuickNotesMapped,
    workoutTemplates: uiTemplates,
    mockLifecycle: buildLifecycle(trainer, access, requiredLegalComplete),
    accessStatus:
      access?.accessStatus != null ? parseTrainerProductAccessStatus(access.accessStatus) : "demo_unlimited",
  };
}
