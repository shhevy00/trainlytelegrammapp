"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from "react";
import { createWorkoutBootstrapFromTemplate as resolveBootstrapFromTemplate } from "@/lib/workout/workoutBootstrapFromTemplate";
import { useWorkoutBootstrapBridge } from "@/lib/workout/useWorkoutBootstrapBridge";
import type { JournalCompletedWorkout, JournalEntry, JournalNoteEntry } from "@/lib/types";
import {
  validateTemplateInput,
  type CreateWorkoutTemplateInput,
  type UpdateWorkoutTemplateInput,
  type WorkoutTemplate,
} from "@/lib/workout/templates";
import type { ExerciseHistoryDemo } from "@/lib/mock/workoutDemo";
import { buildExerciseHistoryFromJournal } from "@/lib/journal/exerciseHistoryFromJournal";
import { buildRepeatSessionFromSavedWorkout } from "@/lib/workout/repeatFromJournal";
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
  trainlyDiscardWorkoutDraftAction,
  trainlyLoadWorkoutDraftAction,
  trainlySaveWorkoutDraftAction,
  trainlySetSubscriptionStatusAction,
  trainlyUpdateWorkoutTemplateAction,
  trainlyUpdateJournalNoteAction,
  trainlyUpdateJournalWorkoutAction,
} from "@/app/actions/trainly";
import { TrainlyProductAccessDeniedError } from "@/lib/billing/accessGate";
import type { WorkoutSessionState } from "@/lib/workout/types";
import { LegalConsentRedirect } from "@/components/shell/LegalConsentRedirect";
import { MockAppContext, type MockAppContextValue } from "@/lib/mock/MockAppProvider";

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

  const {
    overviewDraftPreview,
    consumeWorkoutBootstrap,
    queueWorkoutBootstrap,
    syncOverviewWorkoutDraft,
    clearOverviewWorkoutDraft,
    consumeOverviewDraftBootstrap,
  } = useWorkoutBootstrapBridge();

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
      try {
        const id = await trainlyAddClientAction(payload);
        setSnap(await refresh());
        return id;
      } catch (e) {
        if (e instanceof TrainlyProductAccessDeniedError) {
          throw new Error(e.message);
        }
        throw e;
      }
    },
    [],
  );

  const addCompletedWorkout = useCallback(async (entry: JournalCompletedWorkout): Promise<void> => {
    try {
      await trainlyAddCompletedWorkoutAction(entry);
      setSnap(await refresh());
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Не удалось сохранить тренировку.";
      throw new Error(msg);
    }
  }, []);

  const addNoteEntry = useCallback(async (entry: JournalNoteEntry): Promise<void> => {
    try {
      await trainlyAddNoteEntryAction(entry);
      setSnap(await refresh());
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Не удалось сохранить заметку.";
      throw new Error(msg);
    }
  }, []);

  const updateJournalWorkout = useCallback(
    async (
      id: string,
      input: import("@/lib/journal/validateJournalUpdate").JournalWorkoutUpdateInput,
    ): Promise<{ ok: true } | { ok: false; errors: string[] }> => {
      try {
        const res = await trainlyUpdateJournalWorkoutAction(id, input);
        if (res.ok) setSnap(await refresh());
        return res;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Не удалось обновить запись.";
        return { ok: false, errors: [msg] };
      }
    },
    [],
  );

  const updateJournalNote = useCallback(
    async (
      id: string,
      input: import("@/lib/journal/validateJournalUpdate").JournalNoteUpdateInput,
    ): Promise<{ ok: true } | { ok: false; errors: string[] }> => {
      try {
        const res = await trainlyUpdateJournalNoteAction(id, input);
        if (res.ok) setSnap(await refresh());
        return res;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Не удалось обновить запись.";
        return { ok: false, errors: [msg] };
      }
    },
    [],
  );

  const saveWorkoutDraft = useCallback(
    async (payload: {
      workoutId: string;
      session: WorkoutSessionState;
      status: "draft" | "in_progress";
      templateId?: string | null;
    }): Promise<{ ok: true } | { ok: false; error: string; conflictWorkoutId?: string }> => {
      return trainlySaveWorkoutDraftAction(payload);
    },
    [],
  );

  const loadWorkoutDraft = useCallback(async (clientId: string) => trainlyLoadWorkoutDraftAction(clientId), []);

  const discardWorkoutDraft = useCallback(async (workoutId: string): Promise<void> => {
    await trainlyDiscardWorkoutDraftAction(workoutId);
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

  const prepareRepeatFromWorkout = useCallback(
    (workoutId: string): boolean => {
      const entry = snap.journalEntries.find((e) => e.id === workoutId);
      if (!entry || entry.kind !== "workout") return false;
      if (entry.exercises.length === 0) return false;
      const session = buildRepeatSessionFromSavedWorkout(entry);
      queueWorkoutBootstrap({
        session,
        referenceHintsByExerciseName: {},
        rememberBlock: "",
        startSource: "repeat",
      });
      return true;
    },
    [snap.journalEntries, queueWorkoutBootstrap],
  );

  const createWorkoutBootstrapFromTemplate = useCallback(
    (params: {
      clientId: string;
      templateId: string;
      scheduleItemId?: string;
      titleOverride?: string;
      debtAcknowledged?: boolean;
    }): { ok: true } | { ok: false; error: string } => {
      const result = resolveBootstrapFromTemplate({
        ...params,
        client: resolveClient(params.clientId),
        template: snap.workoutTemplates.find((t) => t.id === params.templateId),
      });
      if (!result.ok) return result;
      queueWorkoutBootstrap(result.bootstrap);
      return { ok: true };
    },
    [resolveClient, snap.workoutTemplates, queueWorkoutBootstrap],
  );

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
    const res = await trainlySetSubscriptionStatusAction(status);
    if (!res.ok) {
      throw new Error(res.error);
    }
    setSnap(await refresh());
  }, []);

  const resetMockLifecycle = useCallback(async (): Promise<void> => {
    await trainlyLogoutAction();
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
      updateJournalWorkout,
      updateJournalNote,
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
      saveWorkoutDraft,
      loadWorkoutDraft,
      discardWorkoutDraft,
    }),
    [
      snap,
      addClient,
      getExerciseHistoryForClient,
      addCompletedWorkout,
      addNoteEntry,
      updateJournalWorkout,
      updateJournalNote,
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
      saveWorkoutDraft,
      loadWorkoutDraft,
      discardWorkoutDraft,
    ],
  );

  return (
    <>
      <LegalConsentRedirect legalAccepted={snap.mockLifecycle.mockLegalStatus === "accepted"} />
      <MockAppContext.Provider value={value}>{children}</MockAppContext.Provider>
    </>
  );
}
