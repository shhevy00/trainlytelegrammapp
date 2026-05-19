"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { spendOneClientSessionBalance, coachClientSessionsBalanceShortRu } from "@/lib/coach/paidSessions";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { Card } from "@/components/ui/card";
import { ExerciseCard } from "@/components/workout/ExerciseCard";
import { HistorySheet } from "@/components/workout/HistorySheet";
import { MoreSheet } from "@/components/workout/MoreSheet";
import { ReplaceExerciseSheet } from "@/components/workout/ReplaceExerciseSheet";
import { StructureSheet } from "@/components/workout/StructureSheet";
import { WorkoutContentTabs, type WorkoutContentTabId } from "@/components/workout/WorkoutContentTabs";
import { WorkoutLiveStatsRow } from "@/components/workout/WorkoutLiveStatsRow";
import { WorkoutNotesPanel } from "@/components/workout/WorkoutNotesPanel";
import { WorkoutScreenHeader } from "@/components/workout/WorkoutScreenHeader";
import { WorkoutSessionContextCard } from "@/components/workout/WorkoutSessionContextCard";
import { WorkoutStickyFooter } from "@/components/workout/WorkoutStickyFooter";
import { buildWorkoutLiveSessionStats } from "@/lib/workout/liveSessionStats";
import { demoExerciseHistory, type ExerciseHistoryDemo } from "@/lib/mock/workoutDemo";
import { newWorkoutId } from "@/lib/workout/ids";
import { createEmptySetRow } from "@/lib/workout/rows";
import {
  computeWorkoutVolumeKg,
  countFilledSetsInExercise,
  countFilledSetsWorkout,
  countNonSkippedExercises,
  formatSummaryVolumeCell,
  mainResultHint,
  setRowHasMeaningfulData,
  workoutHasExerciseWithNoSetRows,
} from "@/lib/workout/calculations";
import { appendDropRow } from "@/lib/workout/drop";
import { workoutMeaningfulSignature } from "@/lib/workout/dirty";
import { insertPreviousValues } from "@/lib/workout/insertPrevious";
import type { JournalCompletedWorkout, JournalNoteEntry } from "@/lib/types";
import { useMockApp } from "@/lib/mock/MockAppProvider";
import { normalizeWorkoutBootstrap, type WorkoutLoggerBootstrap } from "@/lib/workout/templates";
import { collectRecentExerciseNamesForClient } from "@/lib/workout/recentExerciseNames";
import { readRestTimerPreference, type RestTimerSec } from "@/lib/workout/restTimerPreference";
import { resolvePersistedWorkoutId } from "@/lib/workout/resolvePersistedWorkoutId";
import { useWorkoutDraftAutosave } from "@/lib/workout/useWorkoutDraftAutosave";
import type { WorkoutExercise, WorkoutSessionState, WorkoutSetRow } from "@/lib/workout/types";

type Phase = "logging" | "summary";

type BlockingModal =
  | null
  | "safe_exit"
  | "no_filled"
  | "empty_exercises"
  | "finish_confirm"
  | "unnamed_exercise"
  | "finish_save_error";

type SummarySnapshot =
  | {
      variant: "completed";
      clientId: string;
      clientName: string;
      title: string;
      durationMin: number;
      volumeKg: number | null;
      filledSets: number;
      exerciseCount: number;
      hint: string;
      journalId: string;
      /** После сохранения (mock: как в addCompletedWorkout). */
      remainingSessionsAfter: number;
    }
  | {
      variant: "note";
      clientId: string;
      clientName: string;
      title: string;
      durationMin: number;
      journalId: string;
    };

type ElapsedAction = { type: "tick"; startedAtMs: number };

function elapsedReducer(_: number, action: ElapsedAction): number {
  if (action.type === "tick") {
    return Date.now() - action.startedAtMs;
  }
  return 0;
}

function collectDependentSetIds(rows: WorkoutSetRow[], rootId: string): Set<string> {
  const out = new Set<string>([rootId]);
  let added = true;
  while (added) {
    added = false;
    for (const r of rows) {
      if (r.parentSetId !== null && out.has(r.parentSetId) && !out.has(r.id)) {
        out.add(r.id);
        added = true;
      }
    }
  }
  return out;
}

function workoutHasUnnamedExerciseWithFilledSets(exercises: WorkoutExercise[]): boolean {
  return exercises.some(
    (ex) => !ex.skipped && ex.name.trim() === "" && countFilledSetsInExercise(ex) > 0,
  );
}

/** Прямой заход на /workout без bootstrap: уводим на выбор старта (без демо-сессии). */
function WorkoutLoggerRedirect(): ReactElement {
  const router = useRouter();
  useEffect(() => {
    router.replace("/start-workout");
  }, [router]);
  return (
    <main className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-2 px-4 py-10">
      <p className="text-sm text-[var(--tg-muted)]">Переход к выбору тренировки…</p>
    </main>
  );
}

function WorkoutLoggerInner({ bootstrap }: { bootstrap: WorkoutLoggerBootstrap }): ReactElement {
  const {
    syncOverviewWorkoutDraft,
    clearOverviewWorkoutDraft,
    getExerciseHistoryForClient,
    addCompletedWorkout,
    addNoteEntry,
    saveWorkoutDraft,
    discardWorkoutDraft,
    clients,
    journalEntries,
  } = useMockApp();
  const router = useRouter();
  const finishSaveStartedRef = useRef(false);
  const scrollMainRef = useRef<HTMLElement | null>(null);
  const initialSession = bootstrap.session;
  const persistedWorkoutId = useMemo(() => resolvePersistedWorkoutId(bootstrap), [bootstrap]);
  const templateId = bootstrap.templateId ?? null;

  const [session, setSession] = useState<WorkoutSessionState>(() => initialSession);
  const referenceHints = bootstrap.referenceHintsByExerciseName;
  const [baselineSig, setBaselineSig] = useState<string>(() =>
    workoutMeaningfulSignature(initialSession),
  );

  const [phase, setPhase] = useState<Phase>("logging");
  const [summary, setSummary] = useState<SummarySnapshot | null>(null);

  const [blockingModal, setBlockingModal] = useState<BlockingModal>(null);
  const [finishPending, setFinishPending] = useState(false);
  const [finishSaveError, setFinishSaveError] = useState<string | null>(null);
  const [structureOpen, setStructureOpen] = useState(false);
  const [historyExerciseId, setHistoryExerciseId] = useState<string | null>(null);
  const [moreExerciseId, setMoreExerciseId] = useState<string | null>(null);
  const [replaceExerciseId, setReplaceExerciseId] = useState<string | null>(null);
  const [restTimerSec, setRestTimerSec] = useState<RestTimerSec>(() => readRestTimerPreference());
  const [restCountdownSec, setRestCountdownSec] = useState<number | null>(null);
  const [deleteSetTarget, setDeleteSetTarget] = useState<{ exerciseId: string; rowId: string } | null>(null);
  const [exerciseDeleteConfirmId, setExerciseDeleteConfirmId] = useState<string | null>(null);
  const [contentTab, setContentTab] = useState<WorkoutContentTabId>("exercises");

  const [elapsedMs, dispatchElapsed] = useReducer(elapsedReducer, 0);

  const dirtyRef = useRef(false);
  /** После первого изменения черновика: синхронизация Overview может его очищать при возврате к baseline. */
  const dirtyEverRef = useRef(false);

  const sig = workoutMeaningfulSignature(session);
  const dirty = sig !== baselineSig;

  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  useEffect(() => {
    if (dirty) dirtyEverRef.current = true;
  }, [dirty]);

  /** Обновляет черновик в MockApp для Overview (без персистентности между вкладками). See Stage 7 TODO in PRODUCT flows. */
  useEffect(() => {
    if (phase !== "logging") {
      syncOverviewWorkoutDraft(null);
      return;
    }
    if (!dirty) {
      if (dirtyEverRef.current) syncOverviewWorkoutDraft(null);
      return;
    }
    syncOverviewWorkoutDraft({
      session: structuredClone(session),
      referenceHintsByExerciseName: { ...referenceHints },
      rememberBlock: "",
    });
  }, [phase, dirty, session, referenceHints, syncOverviewWorkoutDraft]);

  useWorkoutDraftAutosave({
    enabled: true,
    workoutId: persistedWorkoutId,
    templateId,
    session,
    sessionSignature: sig,
    dirty,
    phase,
    saveWorkoutDraft,
    onSaveError: (message) => {
      if (phase === "logging") setFinishSaveError(message);
    },
  });

  useEffect(() => {
    if (restCountdownSec == null || restCountdownSec <= 0) return;
    const id = window.setInterval(() => {
      setRestCountdownSec((prev) => (prev == null || prev <= 1 ? null : prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [restCountdownSec]);

  const recentExerciseNames = useMemo(
    () => collectRecentExerciseNamesForClient(journalEntries, session.clientId),
    [journalEntries, session.clientId],
  );

  useEffect(() => {
    dispatchElapsed({ type: "tick", startedAtMs: session.startedAtMs });
    const id = window.setInterval(() => {
      dispatchElapsed({ type: "tick", startedAtMs: session.startedAtMs });
    }, 1000);
    return () => window.clearInterval(id);
  }, [session.startedAtMs]);

  useEffect(() => {
    if (phase !== "logging") return;
    window.history.pushState({ workoutGuard: true }, "");
    const onPopState = (): void => {
      if (!dirtyRef.current) return;
      window.history.pushState({ workoutGuard: true }, "");
      setBlockingModal("safe_exit");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [phase]);

  useEffect(() => {
    if (!dirty || phase !== "logging") return;
    const onBeforeUnload = (e: BeforeUnloadEvent): void => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty, phase]);

  const hideBottomNavOnWorkout = true;
  const mainBottomPad = "pb-[calc(10.5rem+max(0.5rem,env(safe-area-inset-bottom,0px)))]";

  const liveStats = useMemo(
    () => buildWorkoutLiveSessionStats(session.exercises, elapsedMs),
    [session.exercises, elapsedMs],
  );

  const exerciseCountForTabs = countNonSkippedExercises(session.exercises);

  const clientRemainingSessions = useMemo(() => {
    const c = clients.find((cl) => cl.id === session.clientId);
    return c?.remainingSessions ?? 0;
  }, [clients, session.clientId]);

  const resetWorkout = useCallback((): void => {
    dirtyEverRef.current = false;
    clearOverviewWorkoutDraft();
    router.replace("/start-workout");
  }, [clearOverviewWorkoutDraft, router]);

  const handleBack = useCallback((): void => {
    if (dirtyRef.current) {
      setBlockingModal("safe_exit");
      return;
    }
    router.back();
  }, [router]);

  const saveDraftBaseline = useCallback((): void => {
    setBaselineSig(workoutMeaningfulSignature(session));
    setBlockingModal(null);
  }, [session]);

  const patchExercise = useCallback((exerciseId: string, patch: Partial<WorkoutExercise>): void => {
    setSession((s) => ({
      ...s,
      exercises: s.exercises.map((ex) => (ex.id === exerciseId ? { ...ex, ...patch } : ex)),
    }));
  }, []);

  const scrollExerciseIntoView = useCallback((anchorId: string): void => {
    const run = (): void => {
      const container = scrollMainRef.current;
      const el = document.getElementById(anchorId);
      if (!container || !el) return;
      const footerReservePx = 200;
      const elTop = el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - 12;
      const elBottom = el.getBoundingClientRect().bottom - container.getBoundingClientRect().top + container.scrollTop;
      const visibleBottom = container.scrollTop + container.clientHeight - footerReservePx;
      const target =
        elBottom > visibleBottom
          ? elBottom - container.clientHeight + footerReservePx
          : elTop;
      const maxScroll = container.scrollHeight - container.clientHeight;
      container.scrollTo({ top: Math.max(0, Math.min(maxScroll, target)), behavior: "smooth" });
    };
    requestAnimationFrame(() => requestAnimationFrame(run));
  }, []);

  const jumpToExercise = useCallback(
    (anchorId: string): void => {
      setContentTab("exercises");
      scrollExerciseIntoView(anchorId);
    },
    [scrollExerciseIntoView],
  );

  const moveExercise = useCallback((id: string, direction: -1 | 1): void => {
    setSession((s) => {
      const idx = s.exercises.findIndex((e) => e.id === id);
      if (idx < 0) return s;
      const target = idx + direction;
      if (target < 0 || target >= s.exercises.length) return s;
      const exercises = [...s.exercises];
      const [item] = exercises.splice(idx, 1);
      exercises.splice(target, 0, item!);
      return { ...s, exercises };
    });
  }, []);

  const addBlankExercise = useCallback((): void => {
    const exerciseId = newWorkoutId();
    setContentTab("exercises");
    setSession((s) => {
      const nextExercises = [
        ...s.exercises,
        {
          id: exerciseId,
          name: "",
          comment: "",
          skipped: false,
          sets: [createEmptySetRow()],
        },
      ];
      queueMicrotask(() => jumpToExercise(`ex-${exerciseId}`));
      return {
        ...s,
        exercises: nextExercises,
      };
    });
  }, [jumpToExercise]);

  const patchSet = useCallback(
    (exerciseId: string, setId: string, patch: Partial<WorkoutSetRow>): void => {
      let shouldStartRest = false;
      setSession((s) => ({
        ...s,
        exercises: s.exercises.map((ex) => {
          if (ex.id !== exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map((row) => {
              if (row.id !== setId) return row;
              if (patch.done === true && !row.done && restTimerSec > 0) {
                shouldStartRest = true;
              }
              return { ...row, ...patch };
            }),
          };
        }),
      }));
      if (shouldStartRest) {
        setRestCountdownSec(restTimerSec);
      }
    },
    [restTimerSec],
  );

  const deleteExercise = useCallback((exerciseId: string): void => {
    setSession((s) => ({
      ...s,
      exercises: s.exercises.filter((ex) => ex.id !== exerciseId),
    }));
  }, []);

  const removeSetFromExercise = useCallback((exerciseId: string, setId: string): void => {
    setSession((s) => ({
      ...s,
      exercises: s.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const drop = collectDependentSetIds(ex.sets, setId);
        const next = ex.sets.filter((row) => !drop.has(row.id));
        const rows = next.length > 0 ? next : [createEmptySetRow()];
        return { ...ex, sets: rows };
      }),
    }));
  }, []);

  const requestDeleteSet = useCallback(
    (exerciseId: string, rowId: string): void => {
      const ex = session.exercises.find((e) => e.id === exerciseId);
      const row = ex?.sets.find((r) => r.id === rowId);
      if (!ex || !row) return;
      if (setRowHasMeaningfulData(row)) {
        setDeleteSetTarget({ exerciseId, rowId });
        return;
      }
      removeSetFromExercise(exerciseId, rowId);
    },
    [session.exercises, removeSetFromExercise],
  );

  const addExerciseWithName = useCallback((name: string): void => {
    const exerciseId = newWorkoutId();
    const trimmed = name.trim();
    setContentTab("exercises");
    setSession((s) => {
      const nextExercises = [
        ...s.exercises,
        {
          id: exerciseId,
          name: trimmed,
          comment: "",
          skipped: false,
          sets: [createEmptySetRow()],
        },
      ];
      queueMicrotask(() => jumpToExercise(`ex-${exerciseId}`));
      return { ...s, exercises: nextExercises };
    });
  }, [jumpToExercise]);

  const requestDeleteExerciseFromStructure = useCallback(
    (id: string): void => {
      const ex = session.exercises.find((e) => e.id === id);
      if (!ex) return;
      if (countFilledSetsInExercise(ex) > 0) {
        setExerciseDeleteConfirmId(id);
        return;
      }
      deleteExercise(id);
    },
    [session.exercises, deleteExercise],
  );

  const addDropForExercise = useCallback((exerciseId: string): void => {
    setSession((s) => ({
      ...s,
      exercises: s.exercises.map((ex) =>
        ex.id !== exerciseId ? ex : { ...ex, sets: appendDropRow(ex.sets) },
      ),
    }));
  }, []);

  const resolveInsertTemplate = useCallback(
    (exerciseId: string): { weight: string; reps: string }[] | null => {
      const ex = session.exercises.find((e) => e.id === exerciseId);
      if (!ex) return null;
      const name = ex.name.trim();
      if (name.length > 0) {
        const fromJournal = getExerciseHistoryForClient(session.clientId, name);
        if (fromJournal && fromJournal.insertTemplate.length > 0) return fromJournal.insertTemplate;
      }
      const demo = demoExerciseHistory[exerciseId]?.insertTemplate;
      return demo && demo.length > 0 ? demo : null;
    },
    [session.exercises, session.clientId, getExerciseHistoryForClient],
  );

  const applyInsertPrevious = useCallback(
    (exerciseId: string): void => {
      const template = resolveInsertTemplate(exerciseId);
      if (!template) return;
      const ex = session.exercises.find((e) => e.id === exerciseId);
      if (!ex) return;
      patchExercise(exerciseId, insertPreviousValues(ex, template));
    },
    [patchExercise, resolveInsertTemplate, session.exercises],
  );

  const openFinishFlow = useCallback((): void => {
    const filled = countFilledSetsWorkout(session.exercises);
    if (filled === 0) {
      setBlockingModal("no_filled");
      return;
    }
    if (workoutHasUnnamedExerciseWithFilledSets(session.exercises)) {
      setBlockingModal("unnamed_exercise");
      return;
    }
    if (workoutHasExerciseWithNoSetRows(session.exercises)) {
      setBlockingModal("empty_exercises");
      return;
    }
    setBlockingModal("finish_confirm");
  }, [session.exercises]);

  const finalizeCompletedWorkout = useCallback((): void => {
    if (finishSaveStartedRef.current || finishPending) return;
    finishSaveStartedRef.current = true;
    setFinishPending(true);
    setFinishSaveError(null);

    const durationMin = Math.max(1, Math.round((Date.now() - session.startedAtMs) / 60_000));
    const volumeKg = computeWorkoutVolumeKg(session.exercises);
    const filledSets = countFilledSetsWorkout(session.exercises);
    const exerciseCount = countNonSkippedExercises(session.exercises);
    const hint = mainResultHint(volumeKg, filledSets);
    const id = newWorkoutId();
    const entry: JournalCompletedWorkout = {
      kind: "workout",
      id,
      clientId: session.clientId,
      clientName: session.clientName,
      ...(session.scheduleItemId ? { scheduleItemId: session.scheduleItemId } : {}),
      createdAtMs: Date.now(),
      durationMin,
      status: "completed",
      title: session.title,
      exercises: structuredClone(session.exercises),
      workoutComment: session.workoutComment,
      filledSetCount: filledSets,
      volumeKg,
      summaryHint: hint,
    };
    const clientBefore = clients.find((c) => c.id === session.clientId);
    const remainingSessionsAfter =
      clientBefore != null ? spendOneClientSessionBalance(clientBefore.remainingSessions) : 0;

    void (async (): Promise<void> => {
      try {
        await addCompletedWorkout(entry);
        await discardWorkoutDraft(persistedWorkoutId);
        dirtyEverRef.current = false;
        clearOverviewWorkoutDraft();
        setSummary({
          variant: "completed",
          clientId: session.clientId,
          clientName: session.clientName,
          title: session.title,
          durationMin,
          volumeKg,
          filledSets,
          exerciseCount,
          hint,
          journalId: id,
          remainingSessionsAfter,
        });
        setPhase("summary");
        setBlockingModal(null);
        setBaselineSig(workoutMeaningfulSignature(session));
      } catch (e) {
        finishSaveStartedRef.current = false;
        const msg = e instanceof Error ? e.message : "Не удалось сохранить тренировку.";
        setFinishSaveError(msg);
        setBlockingModal("finish_save_error");
      } finally {
        setFinishPending(false);
      }
    })();
  }, [
    addCompletedWorkout,
    clearOverviewWorkoutDraft,
    clients,
    discardWorkoutDraft,
    finishPending,
    persistedWorkoutId,
    session,
  ]);

  const finalizeNoteSession = useCallback((): void => {
    if (finishSaveStartedRef.current || finishPending) return;
    finishSaveStartedRef.current = true;
    setFinishPending(true);
    setFinishSaveError(null);

    const durationMin = Math.max(1, Math.round((Date.now() - session.startedAtMs) / 60_000));
    const id = newWorkoutId();
    const entry: JournalNoteEntry = {
      kind: "note",
      id,
      clientId: session.clientId,
      clientName: session.clientName,
      ...(session.scheduleItemId ? { scheduleItemId: session.scheduleItemId } : {}),
      createdAtMs: Date.now(),
      durationMin,
      status: "completed_as_note",
      title: session.title,
      workoutComment: session.workoutComment,
    };

    void (async (): Promise<void> => {
      try {
        await addNoteEntry(entry);
        await discardWorkoutDraft(persistedWorkoutId);
        dirtyEverRef.current = false;
        clearOverviewWorkoutDraft();
        setSummary({
          variant: "note",
          clientId: session.clientId,
          clientName: session.clientName,
          title: session.title,
          durationMin,
          journalId: id,
        });
        setPhase("summary");
        setBlockingModal(null);
        setBaselineSig(workoutMeaningfulSignature(session));
      } catch (e) {
        finishSaveStartedRef.current = false;
        const msg = e instanceof Error ? e.message : "Не удалось сохранить заметку.";
        setFinishSaveError(msg);
        setBlockingModal("finish_save_error");
      } finally {
        setFinishPending(false);
      }
    })();
  }, [
    addNoteEntry,
    clearOverviewWorkoutDraft,
    discardWorkoutDraft,
    finishPending,
    persistedWorkoutId,
    session,
  ]);

  const moreExercise = moreExerciseId
    ? session.exercises.find((e) => e.id === moreExerciseId) ?? null
    : null;

  const historyExerciseName =
    historyExerciseId !== null
      ? (session.exercises.find((e) => e.id === historyExerciseId)?.name ?? "")
      : "";

  const mergedHistoryForSheet = useMemo((): ExerciseHistoryDemo | null => {
    if (historyExerciseId === null) return null;
    const ex = session.exercises.find((e) => e.id === historyExerciseId);
    const name = ex?.name.trim() ?? "";
    if (name.length > 0) {
      const fromJournal = getExerciseHistoryForClient(session.clientId, name);
      if (fromJournal) return fromJournal;
    }
    return demoExerciseHistory[historyExerciseId] ?? null;
  }, [historyExerciseId, session.exercises, session.clientId, getExerciseHistoryForClient]);

  if (phase === "summary" && summary) {
    const isNote = summary.variant === "note";
    return (
      <main className="flex w-full flex-col gap-4 px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
        <header className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {isNote ? "Заметка сохранена" : "Готово"}
          </h1>
          <p className="text-sm text-[var(--tg-muted)]">
            {isNote ? "Сохранено без подходов" : "Тренировка сохранена"}
          </p>
        </header>

        <section className="trainly-surface-card premium-surface p-4">
          <p className="font-display text-lg font-semibold text-[var(--text-primary)]">{summary.clientName}</p>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">{summary.title}</p>

          {summary.variant === "completed" ? (
            <>
              <div className="mt-4">
                <WorkoutLiveStatsRow
                  stats={{
                    volumeLabel: formatSummaryVolumeCell(summary.volumeKg, summary.filledSets),
                    exerciseCount: summary.exerciseCount,
                    filledSets: summary.filledSets,
                    elapsedLabel: `${summary.durationMin} мин`,
                  }}
                />
              </div>
              <p className="mt-3 rounded-xl border border-[color:var(--border-soft)] bg-[color:color-mix(in_srgb,var(--bg-card),transparent_50%)] px-3 py-2.5 text-sm leading-snug text-[var(--text-secondary)]">
                {summary.hint}
              </p>
              <p className="mt-3 text-xs text-[var(--text-muted)]">
                Баланс после сохранения:{" "}
                <span className="font-semibold text-[var(--text-primary)]">
                  {coachClientSessionsBalanceShortRu(summary.remainingSessionsAfter)}
                </span>
              </p>
            </>
          ) : null}
        </section>

        <div className="flex flex-col gap-3">
          <Link
            href={`/workouts/${summary.journalId}`}
            className="trainly-cta-primary app-btn w-full min-h-[52px] px-4 py-3.5 text-center text-[15px] font-bold"
            prefetch={false}
          >
            Открыть запись
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-[color:var(--border-soft)] pt-3 text-sm">
            <Link
              href="/journal"
              prefetch={false}
              className="font-medium text-[var(--text-secondary)] underline-offset-2 hover:text-[var(--text-primary)]"
            >
              В журнал
            </Link>
            {!isNote ? (
              <Link
                href={`/clients/${encodeURIComponent(summary.clientId)}`}
                prefetch={false}
                className="font-medium text-[var(--text-secondary)] underline-offset-2 hover:text-[var(--text-primary)]"
              >
                К клиенту
              </Link>
            ) : null}
            <button
              type="button"
              className="font-medium text-[var(--text-secondary)] underline-offset-2 hover:text-[var(--text-primary)]"
              onClick={resetWorkout}
            >
              Новая тренировка
            </button>
          </div>
        </div>

      </main>
    );
  }

  return (
  <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <main
        ref={scrollMainRef}
        className={`app-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-y-contain px-3 py-3 ${mainBottomPad} sm:px-4`}
      >
        <WorkoutScreenHeader onBack={handleBack} />
        <WorkoutSessionContextCard
          clientName={session.clientName}
          title={session.title}
          startedAtMs={session.startedAtMs}
          onTitleChange={(title) => setSession((s) => ({ ...s, title }))}
        />
        <WorkoutLiveStatsRow stats={liveStats} />
        <section className="trainly-surface-card px-3 py-2.5">
          <label className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]" htmlFor="session-comment-inline">
            Учесть
          </label>
          <textarea
            id="session-comment-inline"
            rows={2}
            placeholder="Ограничения, самочувствие, фокус сессии…"
            value={session.workoutComment}
            onChange={(e) => setSession((s) => ({ ...s, workoutComment: e.target.value }))}
            className="mt-1.5 w-full resize-none rounded-xl border border-[color:var(--border-soft)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[color:var(--border-strong)]"
          />
        </section>
        <WorkoutContentTabs
          activeTab={contentTab}
          exerciseCount={exerciseCountForTabs}
          onTabChange={setContentTab}
          notesPanel={
            <WorkoutNotesPanel
              workoutComment={session.workoutComment}
              dirty={dirty}
              onWorkoutCommentChange={(workoutComment) => setSession((s) => ({ ...s, workoutComment }))}
            />
          }
          exercisesPanel={
            session.exercises.length === 0 ? (
              <Card className="border-dashed border-[color:var(--border-strong)] px-4 py-5">
                <p className="font-medium text-[var(--text-primary)]">Добавьте первое упражнение</p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--tg-muted)]">
                  Так тренировка начнётся с чистой структуры.
                </p>
                <button
                  type="button"
                  className="app-cta-gradient app-btn mt-4 w-full min-h-[48px] px-4 py-3 font-bold"
                  onClick={addBlankExercise}
                >
                  Добавить упражнение
                </button>
              </Card>
            ) : (
              <>
                <section className="flex flex-col gap-3 pb-2">
                  {session.exercises.map((exercise, idx) => (
                    <ExerciseCard
                      key={exercise.id}
                      exerciseIndex={idx + 1}
                      exercise={exercise}
                      scrollAnchorId={`ex-${exercise.id}`}
                      onExercisePatch={(patch) => patchExercise(exercise.id, patch)}
                      onSetChange={(setId, patch) => patchSet(exercise.id, setId, patch)}
                      onRequestDeleteSet={(rowId) => requestDeleteSet(exercise.id, rowId)}
                      onOpenMore={() => setMoreExerciseId(exercise.id)}
                    />
                  ))}
                </section>
              </>
            )
          }
        />
      </main>

      <WorkoutStickyFooter
        hideBottomNav={hideBottomNavOnWorkout}
        finishPending={finishPending}
        restTimerSec={restTimerSec}
        restCountdownSec={restCountdownSec}
        onRestTimerChange={setRestTimerSec}
        onOpenStructure={() => setStructureOpen(true)}
        onAddExercise={() => addBlankExercise()}
        onFinish={openFinishFlow}
      />

      <StructureSheet
        open={structureOpen}
        onClose={() => setStructureOpen(false)}
        exercises={session.exercises}
        onJumpToExercise={jumpToExercise}
        onAddExercise={addExerciseWithName}
        onRenameExercise={(id, name) => patchExercise(id, { name })}
        onRequestDeleteExercise={requestDeleteExerciseFromStructure}
        onMoveExercise={moveExercise}
      />

      <HistorySheet
        open={historyExerciseId !== null}
        exerciseName={historyExerciseName}
        history={mergedHistoryForSheet}
        onClose={() => setHistoryExerciseId(null)}
        onInsertPrevious={() => {
          if (historyExerciseId) applyInsertPrevious(historyExerciseId);
        }}
      />

      <MoreSheet
        key={moreExerciseId ?? "closed"}
        open={moreExercise !== null}
        exercise={moreExercise}
        onClose={() => setMoreExerciseId(null)}
        onExercisePatch={(patch) => {
          if (moreExerciseId) patchExercise(moreExerciseId, patch);
        }}
        onOpenHistory={() => {
          if (moreExerciseId) setHistoryExerciseId(moreExerciseId);
        }}
        onSkipExercise={() => {
          if (moreExerciseId) patchExercise(moreExerciseId, { skipped: true });
        }}
        onDeleteExercise={() => {
          if (moreExerciseId) deleteExercise(moreExerciseId);
        }}
        onAddDropSet={() => {
          if (moreExerciseId) addDropForExercise(moreExerciseId);
        }}
        onChangeSetType={(rowId, type) => {
          if (!moreExerciseId) return;
          patchSet(moreExerciseId, rowId, { setType: type });
        }}
        onOpenReplace={() => {
          if (moreExerciseId) setReplaceExerciseId(moreExerciseId);
        }}
      />

      <ReplaceExerciseSheet
        open={replaceExerciseId !== null}
        currentName={
          replaceExerciseId != null
            ? (session.exercises.find((e) => e.id === replaceExerciseId)?.name ?? "")
            : ""
        }
        suggestions={recentExerciseNames}
        onClose={() => setReplaceExerciseId(null)}
        onSelect={(name) => {
          if (replaceExerciseId) patchExercise(replaceExerciseId, { name });
        }}
      />

      {deleteSetTarget ? (
        <ModalScrim>
          <div
            role="dialog"
            aria-modal="true"
            className="w-[calc(100%-2rem)] max-w-md rounded-3xl border border-[color:var(--border-soft)] bg-[var(--tg-card)] p-5 shadow-2xl"
          >
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Удалить подход?</h2>
            <p className="mt-2 text-sm text-[var(--tg-muted)]">Заполненные данные будут потеряны.</p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                className="app-btn rounded-2xl bg-red-600 px-4 py-3 text-center text-sm font-bold text-white"
                onClick={() => {
                  removeSetFromExercise(deleteSetTarget.exerciseId, deleteSetTarget.rowId);
                  setDeleteSetTarget(null);
                }}
              >
                Удалить
              </button>
              <button
                type="button"
                className="rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]"
                onClick={() => setDeleteSetTarget(null)}
              >
                Отмена
              </button>
            </div>
          </div>
        </ModalScrim>
      ) : null}

      {exerciseDeleteConfirmId ? (
        <ModalScrim>
          <div
            role="dialog"
            aria-modal="true"
            className="w-[calc(100%-2rem)] max-w-md rounded-3xl border border-[color:var(--border-soft)] bg-[var(--tg-card)] p-5 shadow-2xl"
          >
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Удалить упражнение?</h2>
            <p className="mt-2 text-sm text-[var(--tg-muted)]">Заполненные подходы тоже удалятся.</p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                className="app-btn rounded-2xl bg-red-600 px-4 py-3 text-center text-sm font-bold text-white"
                onClick={() => {
                  deleteExercise(exerciseDeleteConfirmId);
                  setExerciseDeleteConfirmId(null);
                  setStructureOpen(false);
                }}
              >
                Удалить
              </button>
              <button
                type="button"
                className="rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]"
                onClick={() => setExerciseDeleteConfirmId(null)}
              >
                Отмена
              </button>
            </div>
          </div>
        </ModalScrim>
      ) : null}

      {blockingModal === "safe_exit" ? (
        <ModalScrim>
          <div
            role="dialog"
            aria-modal="true"
            className="w-[calc(100%-2rem)] max-w-md rounded-3xl border border-[color:var(--border-soft)] bg-[var(--tg-card)] p-5 text-[var(--tg-text)] shadow-2xl"
          >
            <h2 className="text-lg font-semibold">Сохранить черновик?</h2>
            <p className="mt-2 text-sm text-[var(--tg-muted)]">
              Есть записанные данные. Сохраните черновик, чтобы вернуться позже.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                className="app-btn rounded-2xl bg-[var(--tg-accent)] px-4 py-3 text-white shadow-app-primary"
                onClick={saveDraftBaseline}
              >
                Сохранить черновик
              </button>
              <button
                type="button"
                className="rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-4 py-3 text-sm font-semibold"
                onClick={() => {
                  resetWorkout();
                }}
              >
                Выйти без сохранения
              </button>
              <button
                type="button"
                className="rounded-2xl border border-transparent px-4 py-3 text-sm font-semibold text-[var(--tg-muted)]"
                onClick={() => setBlockingModal(null)}
              >
                Отмена
              </button>
            </div>
          </div>
        </ModalScrim>
      ) : null}

      {blockingModal === "no_filled" ? (
        <ModalScrim>
          <div
            role="dialog"
            aria-modal="true"
            className="w-[calc(100%-2rem)] max-w-md rounded-3xl border border-[color:var(--border-soft)] bg-[var(--tg-card)] p-5 shadow-2xl"
          >
            <h2 className="text-lg font-semibold">Без заполненных подходов</h2>
            <p className="mt-2 text-sm text-[var(--tg-muted)]">
              Можно вернуться и добавить данные или сохранить как заметку.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                className="app-btn rounded-2xl bg-[var(--tg-accent)] px-4 py-3 text-white shadow-app-primary"
                onClick={() => setBlockingModal(null)}
              >
                Вернуться
              </button>
              <button
                type="button"
                className="rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]"
                onClick={() => {
                  finalizeNoteSession();
                }}
              >
                Сохранить как заметку
              </button>
            </div>
          </div>
        </ModalScrim>
      ) : null}

      {blockingModal === "empty_exercises" ? (
        <ModalScrim>
          <div
            role="dialog"
            aria-modal="true"
            className="w-[calc(100%-2rem)] max-w-md rounded-3xl border border-[color:var(--border-soft)] bg-[var(--tg-card)] p-5 shadow-2xl"
          >
            <h2 className="text-lg font-semibold">Есть пустые упражнения</h2>
            <p className="mt-2 text-sm text-[var(--tg-muted)]">
              Некоторые упражнения без подходов. Сохранить тренировку?
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                className="rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-4 py-3 text-sm font-semibold"
                onClick={() => setBlockingModal(null)}
              >
                Вернуться
              </button>
              <button
                type="button"
                className="app-btn rounded-2xl bg-[var(--tg-accent)] px-4 py-3 text-white shadow-app-primary"
                onClick={() => setBlockingModal("finish_confirm")}
              >
                Сохранить в журнал
              </button>
            </div>
          </div>
        </ModalScrim>
      ) : null}

      {blockingModal === "unnamed_exercise" ? (
        <ModalScrim>
          <div
            role="dialog"
            aria-modal="true"
            className="w-[calc(100%-2rem)] max-w-md rounded-3xl border border-[color:var(--border-soft)] bg-[var(--tg-card)] p-5 shadow-2xl"
          >
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Укажите название упражнения</h2>
            <p className="mt-2 text-sm text-[var(--tg-muted)]">
              Есть упражнение без названия, но с заполненными подходами. Назовите его или отредактируйте структуру.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                className="app-btn rounded-2xl bg-[var(--tg-accent)] px-4 py-3 text-white shadow-app-primary"
                onClick={() => {
                  setBlockingModal(null);
                  setStructureOpen(true);
                }}
              >
                Открыть структуру
              </button>
              <button
                type="button"
                className="rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]"
                onClick={() => setBlockingModal(null)}
              >
                Вернуться к логу
              </button>
            </div>
          </div>
        </ModalScrim>
      ) : null}

      {blockingModal === "finish_confirm" ? (
        <ModalScrim>
          <div
            role="dialog"
            aria-modal="true"
            className="w-[calc(100%-2rem)] max-w-md rounded-3xl border border-[color:var(--border-soft)] bg-[var(--tg-card)] p-5 shadow-2xl"
          >
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Завершить тренировку?</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-[var(--text-secondary)]">
              <li>
                Упражнений:{" "}
                <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                  {countNonSkippedExercises(session.exercises)}
                </span>
              </li>
              <li>
                Подходов:{" "}
                <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                  {countFilledSetsWorkout(session.exercises)}
                </span>
              </li>
              <li>
                Объём:{" "}
                <span className="font-semibold text-[var(--text-primary)]">
                  {formatSummaryVolumeCell(
                    computeWorkoutVolumeKg(session.exercises),
                    countFilledSetsWorkout(session.exercises),
                  )}
                </span>
              </li>
              <li>
                Время:{" "}
                <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                  {Math.max(1, Math.round(elapsedMs / 60_000))} мин
                </span>
              </li>
              <li>
                Останется занятий:{" "}
                <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                  {coachClientSessionsBalanceShortRu(
                    spendOneClientSessionBalance(clientRemainingSessions),
                  )}
                </span>
              </li>
            </ul>
            <label className="mt-4 block text-sm font-medium" htmlFor="finish-session-note">
              Комментарий к сессии
            </label>
            <textarea
              id="finish-session-note"
              rows={3}
              value={session.workoutComment}
              onChange={(e) => setSession((s) => ({ ...s, workoutComment: e.target.value }))}
              className="mt-2 w-full resize-none rounded-2xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3 py-2 text-sm outline-none focus:border-[color:color-mix(in_srgb,var(--brand-solid),transparent_35%)]"
            />
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                className="trainly-cta-primary app-btn w-full min-h-[48px] px-4 py-3 font-bold disabled:opacity-60"
                disabled={finishPending}
                onClick={() => {
                  finalizeCompletedWorkout();
                }}
              >
                {finishPending ? "Сохранение…" : "Сохранить в журнал"}
              </button>
              <button
                type="button"
                className="rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-4 py-3 text-sm font-semibold"
                onClick={() => setBlockingModal(null)}
              >
                Вернуться
              </button>
            </div>
          </div>
        </ModalScrim>
      ) : null}

      {blockingModal === "finish_save_error" ? (
        <ModalScrim>
          <div
            role="dialog"
            aria-modal="true"
            className="w-[calc(100%-2rem)] max-w-md rounded-3xl border border-[color:var(--border-soft)] bg-[var(--tg-card)] p-5 shadow-2xl"
          >
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Не удалось сохранить</h2>
            <p className="mt-2 text-sm text-[var(--tg-muted)]">
              {finishSaveError ?? "Проверьте подключение и попробуйте снова."}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                className="trainly-cta-primary app-btn w-full min-h-[48px] px-4 py-3 font-bold"
                onClick={() => {
                  setBlockingModal("finish_confirm");
                  finalizeCompletedWorkout();
                }}
              >
                Повторить
              </button>
              <button
                type="button"
                className="rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-4 py-3 text-sm font-semibold"
                onClick={() => setBlockingModal(null)}
              >
                Вернуться к логу
              </button>
            </div>
          </div>
        </ModalScrim>
      ) : null}
    </div>
  );
}

export function WorkoutLogger(): ReactElement {
  const { consumeWorkoutBootstrap } = useMockApp();
  const [bootstrap] = useState<WorkoutLoggerBootstrap | null>(() => {
    const raw = consumeWorkoutBootstrap();
    return raw ? normalizeWorkoutBootstrap(raw) : raw;
  });

  if (bootstrap === null) {
    return <WorkoutLoggerRedirect />;
  }

  return <WorkoutLoggerInner bootstrap={bootstrap} />;
}

function ModalScrim({ children }: { children: ReactNode }): ReactElement {
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/55 p-4 pb-[calc(6.5rem+max(0.35rem,env(safe-area-inset-bottom,0px)))] sm:items-center sm:pb-4">
      {children}
    </div>
  );
}
