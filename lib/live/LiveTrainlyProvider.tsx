"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from "react";
import type { JournalCompletedWorkout, JournalEntry, JournalNoteEntry } from "@/lib/types";
import {
  buildWorkoutSessionFromTemplate,
  validateTemplateInput,
  type CreateWorkoutTemplateInput,
  type UpdateWorkoutTemplateInput,
  type WorkoutLoggerBootstrap,
  type WorkoutTemplate,
} from "@/lib/workout/templates";
import type { ExerciseHistoryDemo } from "@/lib/mock/workoutDemo";
import { buildExerciseHistoryFromJournal } from "@/lib/journal/exerciseHistoryFromJournal";
import { buildRememberBlock } from "@/lib/mock/rememberBlock";
import { buildRepeatSessionFromSavedWorkout, buildReferenceHintsByExerciseName } from "@/lib/workout/repeatFromJournal";
import type { MockClient, MockScheduleItem } from "@/lib/mock/data";
import type { CoachPaymentRecord, CoachQuickNote, CoachQuickNoteType } from "@/lib/mock/coachLedger";
import type { CompleteProfileSetupInput, MockSubscriptionStatus } from "@/lib/mock/lifecycleTypes";
import type { TrainlySnapshot } from "@/lib/trainly/snapshotTypes";
import {
  enterDevTrainerSessionAction,
  refreshTrainlySnapshotAction,
  trainlyAcceptLegalAction,
  trainlyAddClientAction,
  trainlyAddCoachQuickNoteAction,
  trainlyAddCompletedWorkoutAction,
  trainlyAddNoteEntryAction,
  trainlyAddScheduleSlotAction,
  trainlyArchiveWorkoutTemplateAction,
  trainlyCompleteProfileAction,
  trainlyCreateWorkoutTemplateAction,
  trainlyLogoutAction,
  trainlyMarkOnboardingSeenAction,
  trainlyMarkScheduleCancelledAction,
  trainlyMarkScheduleMissedAction,
  trainlyRecordCoachPaymentAction,
  trainlySaveWorkoutAsTemplateAction,
  trainlySetSubscriptionStatusAction,
  trainlyTryConsumeAiCreditAction,
  trainlyUpdateWorkoutTemplateAction,
} from "@/app/actions/trainly";
import { LegalConsentRedirect } from "@/components/shell/LegalConsentRedirect";
import { MockAppContext, type MockAppContextValue, type OverviewDraftPreview } from "@/lib/mock/MockAppProvider";

async function refresh(): Promise<TrainlySnapshot> {
  return refreshTrainlySnapshotAction();
}

export function LiveTrainlyProvider({
  initial,
  children,
}: {
  initial: TrainlySnapshot;
  children: ReactNode;
}): ReactElement {
  const [snap, setSnap] = useState<TrainlySnapshot>(initial);

  const scheduleItemsRef = useRef(snap.scheduleItems);
  useEffect(() => {
    scheduleItemsRef.current = snap.scheduleItems;
  }, [snap.scheduleItems]);

  const bootstrapRef = useRef<WorkoutLoggerBootstrap | null>(null);
  const bootstrapReplayUntilMicrotaskRef = useRef<WorkoutLoggerBootstrap | null>(null);
  const bootstrapReplayClearScheduledRef = useRef(false);

  const scheduleBootstrapReplayClear = useCallback((): void => {
    if (bootstrapReplayClearScheduledRef.current) return;
    bootstrapReplayClearScheduledRef.current = true;
    queueMicrotask(() => {
      bootstrapReplayClearScheduledRef.current = false;
      bootstrapReplayUntilMicrotaskRef.current = null;
    });
  }, []);

  const clearBootstrapReplay = useCallback((): void => {
    bootstrapReplayUntilMicrotaskRef.current = null;
    bootstrapReplayClearScheduledRef.current = false;
  }, []);

  const overviewDraftBootstrapRef = useRef<WorkoutLoggerBootstrap | null>(null);
  const [overviewDraftPreview, setOverviewDraftPreview] = useState<OverviewDraftPreview | null>(null);
  const [aiCreditsUsed, setAiCreditsUsed] = useState(0);

  const resolveClient = useCallback(
    (clientId: string): MockClient | undefined => snap.clients.find((c) => c.id === clientId),
    [snap.clients],
  );

  const getExerciseHistoryForClient = useCallback(
    (clientId: string, exerciseName: string): ExerciseHistoryDemo | null =>
      buildExerciseHistoryFromJournal(snap.journalEntries, clientId, exerciseName, snap.todayIso),
    [snap.journalEntries, snap.todayIso],
  );

  const addClient = useCallback(
    async (payload: {
      name: string;
      goal?: string;
      remainingSessions?: number;
      limitation?: string;
    }): Promise<string> => {
      const id = await trainlyAddClientAction(payload);
      setSnap(await refresh());
      return id;
    },
    [],
  );

  const addCompletedWorkout = useCallback(async (entry: JournalCompletedWorkout): Promise<void> => {
    await trainlyAddCompletedWorkoutAction(entry);
    setSnap(await refresh());
  }, []);

  const addNoteEntry = useCallback(async (entry: JournalNoteEntry): Promise<void> => {
    await trainlyAddNoteEntryAction(entry);
    setSnap(await refresh());
  }, []);

  const getJournalEntry = useCallback(
    (id: string): JournalEntry | undefined => snap.journalEntries.find((e) => e.id === id),
    [snap.journalEntries],
  );

  const getScheduleItemById = useCallback(
    (id: string): MockScheduleItem | undefined => snap.scheduleItems.find((s) => s.id === id),
    [snap.scheduleItems],
  );

  const getScheduleItemsByDate = useCallback(
    (dateIso: string): MockScheduleItem[] =>
      snap.scheduleItems
        .filter((s) => s.date === dateIso)
        .slice()
        .sort((a, b) => a.time.localeCompare(b.time)),
    [snap.scheduleItems],
  );

  const getTodayScheduleItems = useCallback(
    (todayIsoArg: string): MockScheduleItem[] => getScheduleItemsByDate(todayIsoArg),
    [getScheduleItemsByDate],
  );

  const markScheduleMissed = useCallback(async (scheduleItemId: string): Promise<void> => {
    await trainlyMarkScheduleMissedAction(scheduleItemId);
    setSnap(await refresh());
  }, []);

  const markScheduleCancelled = useCallback(async (scheduleItemId: string): Promise<void> => {
    await trainlyMarkScheduleCancelledAction(scheduleItemId);
    setSnap(await refresh());
  }, []);

  const addScheduleSlot = useCallback(
    async (payload: {
      clientId: string;
      clientName: string;
      dateIso: string;
      time: string;
      title: string;
      durationMinutes: number;
      templateId?: string;
    }): Promise<{ ok: true; id: string } | { ok: false; error: string }> => {
      const res = await trainlyAddScheduleSlotAction({
        clientId: payload.clientId,
        dateIso: payload.dateIso,
        time: payload.time,
        title: payload.title,
        durationMinutes: payload.durationMinutes,
        templateId: payload.templateId,
      });
      if (res.ok) {
        setSnap(await refresh());
      }
      return res;
    },
    [],
  );

  const recordCoachPayment = useCallback(
    async (payload: {
      clientId: string;
      clientName: string;
      sessionsAdded: number;
      amountRub: number | null;
      comment: string | null;
    }): Promise<void> => {
      await trainlyRecordCoachPaymentAction({
        clientId: payload.clientId,
        sessionsAdded: payload.sessionsAdded,
        amountRub: payload.amountRub,
        comment: payload.comment,
      });
      setSnap(await refresh());
    },
    [],
  );

  const addCoachQuickNote = useCallback(
    async (payload: {
      clientId: string;
      clientName: string;
      type: CoachQuickNoteType;
      text: string;
    }): Promise<void> => {
      await trainlyAddCoachQuickNoteAction({
        clientId: payload.clientId || null,
        type: payload.type,
        text: payload.text,
      });
      setSnap(await refresh());
    },
    [],
  );

  const getCoachQuickNotesForClient = useCallback(
    (clientId: string): CoachQuickNote[] =>
      snap.coachQuickNotes.filter((n) => n.clientId === clientId).sort((a, b) => b.createdAtMs - a.createdAtMs),
    [snap.coachQuickNotes],
  );

  const getCoachPaymentRecordsForClient = useCallback(
    (clientId: string): CoachPaymentRecord[] =>
      snap.coachPaymentRecords.filter((r) => r.clientId === clientId).sort((a, b) => b.createdAtMs - a.createdAtMs),
    [snap.coachPaymentRecords],
  );

  const getTemplatesForClient = useCallback(
    (clientId: string): WorkoutTemplate[] =>
      snap.workoutTemplates
        .filter((t) => t.clientId === clientId && !t.archivedAtIso)
        .sort((a, b) => b.updatedAtIso.localeCompare(a.updatedAtIso) || a.name.localeCompare(b.name, "ru")),
    [snap.workoutTemplates],
  );

  const getTemplateById = useCallback(
    (templateId: string): WorkoutTemplate | undefined => snap.workoutTemplates.find((t) => t.id === templateId),
    [snap.workoutTemplates],
  );

  const createWorkoutTemplate = useCallback(
    async (
      input: CreateWorkoutTemplateInput,
    ): Promise<{ ok: true; template: WorkoutTemplate } | { ok: false; errors: string[] }> => {
      const errors = validateTemplateInput(input);
      if (errors.length > 0) return { ok: false, errors };
      const res = await trainlyCreateWorkoutTemplateAction(input);
      if (!res.ok) return { ok: false, errors: res.errors };
      const next = await refresh();
      setSnap(next);
      const tpl = next.workoutTemplates.find((t) => t.id === res.id);
      if (!tpl) return { ok: false, errors: ["Шаблон создан, но не найден после сохранения."] };
      return { ok: true, template: tpl };
    },
    [],
  );

  const updateWorkoutTemplate = useCallback(
    async (
      templateId: string,
      input: UpdateWorkoutTemplateInput,
    ): Promise<{ ok: true; template: WorkoutTemplate } | { ok: false; errors: string[] }> => {
      const res = await trainlyUpdateWorkoutTemplateAction(templateId, input);
      if (!res.ok) return res;
      const next = await refresh();
      setSnap(next);
      const tpl = next.workoutTemplates.find((t) => t.id === templateId);
      if (!tpl) return { ok: false, errors: ["Шаблон не найден после обновления."] };
      return { ok: true, template: tpl };
    },
    [],
  );

  const archiveWorkoutTemplate = useCallback(
    async (templateId: string): Promise<{ ok: true } | { ok: false; error: string }> => {
      const res = await trainlyArchiveWorkoutTemplateAction(templateId);
      if (res.ok) setSnap(await refresh());
      return res;
    },
    [],
  );

  const saveWorkoutAsTemplate = useCallback(
    async (params: {
      workoutId: string;
      name: string;
    }): Promise<{ ok: true; template: WorkoutTemplate } | { ok: false; errors: string[] }> => {
      const res = await trainlySaveWorkoutAsTemplateAction(params);
      if (!res.ok) return res;
      const next = await refresh();
      setSnap(next);
      const tpl = next.workoutTemplates.find((t) => t.id === res.id);
      if (!tpl) return { ok: false, errors: ["Шаблон не найден после сохранения."] };
      return { ok: true, template: tpl };
    },
    [],
  );

  const getLatestCompletedWorkoutWithStructure = useCallback(
    (clientId: string): JournalCompletedWorkout | undefined => {
      const list = snap.journalEntries.filter(
        (e): e is JournalCompletedWorkout =>
          e.kind === "workout" && e.clientId === clientId && e.exercises.length > 0,
      );
      list.sort((a, b) => b.createdAtMs - a.createdAtMs);
      return list[0];
    },
    [snap.journalEntries],
  );

  const getJournalEntriesForClient = useCallback(
    (clientId: string): JournalEntry[] =>
      snap.journalEntries.filter((e) => e.clientId === clientId).sort((a, b) => b.createdAtMs - a.createdAtMs),
    [snap.journalEntries],
  );

  const consumeWorkoutBootstrap = useCallback((): WorkoutLoggerBootstrap | null => {
    if (bootstrapRef.current != null) {
      const b = bootstrapRef.current;
      bootstrapRef.current = null;
      bootstrapReplayUntilMicrotaskRef.current = b;
      scheduleBootstrapReplayClear();
      return b;
    }
    const replay = bootstrapReplayUntilMicrotaskRef.current;
    if (replay != null) {
      return replay;
    }
    return null;
  }, [scheduleBootstrapReplayClear]);

  const queueWorkoutBootstrap = useCallback(
    (bootstrap: WorkoutLoggerBootstrap): void => {
      clearBootstrapReplay();
      bootstrapRef.current = bootstrap;
    },
    [clearBootstrapReplay],
  );

  const syncOverviewWorkoutDraft = useCallback((bootstrap: WorkoutLoggerBootstrap | null): void => {
    overviewDraftBootstrapRef.current = bootstrap;
    if (!bootstrap) {
      setOverviewDraftPreview((prev) => (prev == null ? prev : null));
      return;
    }
    const nextPreview = {
      clientId: bootstrap.session.clientId,
      clientName: bootstrap.session.clientName,
      title: bootstrap.session.title,
      startedAtMs: bootstrap.session.startedAtMs,
      updatedAtMs: Date.now(),
    };
    setOverviewDraftPreview((prev) => {
      if (
        prev != null &&
        prev.clientId === nextPreview.clientId &&
        prev.clientName === nextPreview.clientName &&
        prev.title === nextPreview.title &&
        prev.startedAtMs === nextPreview.startedAtMs
      ) {
        return prev;
      }
      return nextPreview;
    });
  }, []);

  const clearOverviewWorkoutDraft = useCallback((): void => {
    overviewDraftBootstrapRef.current = null;
    setOverviewDraftPreview(null);
  }, []);

  const consumeOverviewDraftBootstrap = useCallback((): boolean => {
    const b = overviewDraftBootstrapRef.current;
    if (!b) return false;
    overviewDraftBootstrapRef.current = null;
    setOverviewDraftPreview(null);
    clearBootstrapReplay();
    bootstrapRef.current = b;
    return true;
  }, [clearBootstrapReplay]);

  const prepareRepeatFromWorkout = useCallback(
    (workoutId: string): boolean => {
      const entry = snap.journalEntries.find((e) => e.id === workoutId);
      if (!entry || entry.kind !== "workout") return false;
      if (entry.exercises.length === 0) return false;
      const session = buildRepeatSessionFromSavedWorkout(entry);
      const referenceHintsByExerciseName = buildReferenceHintsByExerciseName(entry.exercises);
      const client = resolveClient(entry.clientId);
      const notes = snap.coachQuickNotes
        .filter((n) => n.clientId === entry.clientId)
        .sort((a, b) => b.createdAtMs - a.createdAtMs);
      clearBootstrapReplay();
      bootstrapRef.current = {
        session,
        referenceHintsByExerciseName,
        rememberBlock: client
          ? buildRememberBlock(client, {}, notes)
          : "Не удалось сопоставить клиента для повтора из журнала.",
        startSource: "repeat",
      };
      return true;
    },
    [snap.journalEntries, snap.coachQuickNotes, resolveClient, clearBootstrapReplay],
  );

  const createWorkoutBootstrapFromTemplate = useCallback(
    (params: {
      clientId: string;
      templateId: string;
      scheduleItemId?: string;
      titleOverride?: string;
      debtAcknowledged?: boolean;
    }): { ok: true } | { ok: false; error: string } => {
      const client = resolveClient(params.clientId);
      if (!client) return { ok: false, error: "Клиент не найден." };
      const template = snap.workoutTemplates.find((t) => t.id === params.templateId);
      if (!template) return { ok: false, error: "Шаблон тренировки не найден." };
      if (template.clientId !== params.clientId) {
        return { ok: false, error: "Шаблон не принадлежит выбранному клиенту." };
      }
      if (template.archivedAtIso) return { ok: false, error: "Шаблон в архиве." };
      const session = buildWorkoutSessionFromTemplate({
        template,
        clientId: client.id,
        clientName: client.name,
        titleOverride: params.titleOverride,
        scheduleItemId: params.scheduleItemId,
        ...(params.debtAcknowledged ? { debtAcknowledged: true } : {}),
      });
      const referenceHintsByExerciseName: Record<string, string> = {};
      for (const ex of session.exercises) {
        const hist = buildExerciseHistoryFromJournal(snap.journalEntries, client.id, ex.name, snap.todayIso);
        if (hist && hist.previousSummary.trim().length > 0) {
          referenceHintsByExerciseName[ex.name] = hist.previousSummary;
        }
      }
      const notes = snap.coachQuickNotes
        .filter((n) => n.clientId === client.id)
        .sort((a, b) => b.createdAtMs - a.createdAtMs);
      queueWorkoutBootstrap({
        session,
        referenceHintsByExerciseName,
        rememberBlock: buildRememberBlock(client, { debtAcknowledged: params.debtAcknowledged }, notes),
        startSource: "template",
        templateId: template.id,
      });
      return { ok: true };
    },
    [resolveClient, snap.workoutTemplates, snap.journalEntries, snap.coachQuickNotes, snap.todayIso, queueWorkoutBootstrap],
  );

  const tryConsumeAiCredit = useCallback(async (): Promise<boolean> => {
    const ok = await trainlyTryConsumeAiCreditAction();
    if (ok) {
      setAiCreditsUsed((u) => u + 1);
      setSnap(await refresh());
    }
    return ok;
  }, []);

  const enterDemoAuth = useCallback(async (): Promise<void> => {
    const res = await enterDevTrainerSessionAction();
    if (!res.ok) return;
    setSnap(await refresh());
  }, []);

  const acceptLegalMock = useCallback(async (): Promise<void> => {
    await trainlyAcceptLegalAction();
    setSnap(await refresh());
  }, []);

  const completeProfileSetupMock = useCallback(async (input: CompleteProfileSetupInput): Promise<void> => {
    await trainlyCompleteProfileAction(input);
    setSnap(await refresh());
  }, []);

  const markOnboardingSeen = useCallback(async (): Promise<void> => {
    await trainlyMarkOnboardingSeenAction();
    setSnap(await refresh());
  }, []);

  const setMockSubscriptionStatus = useCallback(async (status: MockSubscriptionStatus): Promise<void> => {
    await trainlySetSubscriptionStatusAction(status);
    setSnap(await refresh());
  }, []);

  const resetMockLifecycle = useCallback(async (): Promise<void> => {
    await trainlyLogoutAction();
    setAiCreditsUsed(0);
    window.location.href = "/welcome";
  }, []);

  const value = useMemo<MockAppContextValue>(
    () => ({
      todayIso: snap.todayIso,
      clients: snap.clients,
      journalEntries: snap.journalEntries,
      scheduleItems: snap.scheduleItems,
      addClient,
      getExerciseHistoryForClient,
      addCompletedWorkout,
      addNoteEntry,
      getJournalEntry,
      getScheduleItemById,
      getScheduleItemsByDate,
      getTodayScheduleItems,
      markScheduleMissed,
      markScheduleCancelled,
      addScheduleSlot,
      prepareRepeatFromWorkout,
      consumeWorkoutBootstrap,
      queueWorkoutBootstrap,
      getLatestCompletedWorkoutWithStructure,
      getJournalEntriesForClient,
      overviewDraftPreview,
      syncOverviewWorkoutDraft,
      clearOverviewWorkoutDraft,
      consumeOverviewDraftBootstrap,
      coachPaymentRecords: snap.coachPaymentRecords,
      coachQuickNotes: snap.coachQuickNotes,
      recordCoachPayment,
      addCoachQuickNote,
      getCoachQuickNotesForClient,
      getCoachPaymentRecordsForClient,
      aiCreditsTotal: snap.aiCreditsTotal,
      aiCreditsUsed,
      tryConsumeAiCredit,
      getTemplatesForClient,
      getTemplateById,
      createWorkoutTemplate,
      updateWorkoutTemplate,
      archiveWorkoutTemplate,
      createWorkoutBootstrapFromTemplate,
      saveWorkoutAsTemplate,
      mockLifecycle: snap.mockLifecycle,
      enterDemoAuth,
      acceptLegalMock,
      completeProfileSetupMock,
      markOnboardingSeen,
      setMockSubscriptionStatus,
      resetMockLifecycle,
    }),
    [
      snap,
      addClient,
      getExerciseHistoryForClient,
      addCompletedWorkout,
      addNoteEntry,
      getJournalEntry,
      getScheduleItemById,
      getScheduleItemsByDate,
      getTodayScheduleItems,
      markScheduleMissed,
      markScheduleCancelled,
      addScheduleSlot,
      prepareRepeatFromWorkout,
      consumeWorkoutBootstrap,
      queueWorkoutBootstrap,
      getLatestCompletedWorkoutWithStructure,
      getJournalEntriesForClient,
      overviewDraftPreview,
      syncOverviewWorkoutDraft,
      clearOverviewWorkoutDraft,
      consumeOverviewDraftBootstrap,
      recordCoachPayment,
      addCoachQuickNote,
      getCoachQuickNotesForClient,
      getCoachPaymentRecordsForClient,
      aiCreditsUsed,
      tryConsumeAiCredit,
      getTemplatesForClient,
      getTemplateById,
      createWorkoutTemplate,
      updateWorkoutTemplate,
      archiveWorkoutTemplate,
      createWorkoutBootstrapFromTemplate,
      saveWorkoutAsTemplate,
      enterDemoAuth,
      acceptLegalMock,
      completeProfileSetupMock,
      markOnboardingSeen,
      setMockSubscriptionStatus,
      resetMockLifecycle,
    ],
  );

  return (
    <>
      <LegalConsentRedirect legalAccepted={snap.mockLifecycle.mockLegalStatus === "accepted"} />
      <MockAppContext.Provider value={value}>{children}</MockAppContext.Provider>
    </>
  );
}
