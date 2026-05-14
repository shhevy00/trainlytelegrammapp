"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ContextualAiHelper } from "@/components/ai/ContextualAiHelper";
import {
  buildPostWorkoutFacts,
  buildPostWorkoutFactsFromSummary,
} from "@/lib/ai/ruleFacts";
import { spendOneClientSessionBalance, coachClientSessionsBalanceShortRu } from "@/lib/coach/paidSessions";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
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
import { StructureSheet } from "@/components/workout/StructureSheet";
import { demoExerciseCardHints, demoExerciseHistory, type ExerciseHistoryDemo } from "@/lib/mock/workoutDemo";
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
import type { WorkoutLoggerBootstrap } from "@/lib/workout/templates";
import type { WorkoutExercise, WorkoutSessionState, WorkoutSetRow } from "@/lib/workout/types";

type Phase = "logging" | "summary";

type BlockingModal = null | "safe_exit" | "no_filled" | "empty_exercises" | "finish_confirm" | "unnamed_exercise";

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

function formatElapsed(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Короткие чипы из блока «что помнить» (разделитель ·). */
function rememberChipsFromBlock(block: string): { visible: string[]; extra: number } {
  const parts = block
    .split("·")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const list = parts.length > 0 ? parts : block.trim() ? [block.trim()] : [];
  const visible = list.slice(0, 3).map((p) => (p.length > 28 ? `${p.slice(0, 27)}…` : p));
  return { visible, extra: Math.max(0, list.length - 3) };
}

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
    getJournalEntry,
    getExerciseHistoryForClient,
    addCompletedWorkout,
    addNoteEntry,
    clients,
  } = useMockApp();
  const router = useRouter();
  const finishSaveStartedRef = useRef(false);
  const initialSession = bootstrap.session;

  const [session, setSession] = useState<WorkoutSessionState>(() => initialSession);
  const referenceHints = bootstrap.referenceHintsByExerciseName;
  const rememberBlock = bootstrap.rememberBlock;
  const [baselineSig, setBaselineSig] = useState<string>(() =>
    workoutMeaningfulSignature(initialSession),
  );

  const [phase, setPhase] = useState<Phase>("logging");
  const [summary, setSummary] = useState<SummarySnapshot | null>(null);

  const [blockingModal, setBlockingModal] = useState<BlockingModal>(null);
  const [structureOpen, setStructureOpen] = useState(false);
  const [historyExerciseId, setHistoryExerciseId] = useState<string | null>(null);
  const [moreExerciseId, setMoreExerciseId] = useState<string | null>(null);
  const [deleteSetTarget, setDeleteSetTarget] = useState<{ exerciseId: string; rowId: string } | null>(null);
  const [exerciseDeleteConfirmId, setExerciseDeleteConfirmId] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [focusExerciseIdx, setFocusExerciseIdx] = useState(0);
  const [restSecondsRemaining, setRestSecondsRemaining] = useState<number | null>(null);

  const [elapsedMs, dispatchElapsed] = useReducer(elapsedReducer, 0);

  const dirtyRef = useRef(false);
  /** После первого изменения черновика: синхронизация Overview может его очищать при возврате к baseline. */
  const dirtyEverRef = useRef(false);

  const sig = workoutMeaningfulSignature(session);
  const dirty = sig !== baselineSig;

  const focusIdxSafe =
    session.exercises.length === 0 ? 0 : Math.max(0, Math.min(focusExerciseIdx, session.exercises.length - 1));

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
      rememberBlock,
    });
  }, [phase, dirty, session, referenceHints, rememberBlock, syncOverviewWorkoutDraft]);

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

  const restTimerActive = restSecondsRemaining !== null && restSecondsRemaining > 0;
  const hasExercisesForFooter = phase === "logging" && session.exercises.length > 0;
  const mainBottomPad = restTimerActive
    ? "pb-[calc(16.5rem+max(0.35rem,env(safe-area-inset-bottom,0px)))]"
    : hasExercisesForFooter
      ? "pb-[calc(13rem+max(0.35rem,env(safe-area-inset-bottom,0px)))]"
      : "pb-[calc(10.5rem+max(0.35rem,env(safe-area-inset-bottom,0px)))]";

  useEffect(() => {
    if (!restTimerActive) return;
    const id = window.setInterval(() => {
      setRestSecondsRemaining((s) => (s === null ? null : s <= 1 ? null : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [restTimerActive]);

  const draftStatusShort = dirty ? "Черновик" : "Ок";

  const summaryAiFactsCompleted = useMemo(() => {
    if (phase !== "summary" || !summary || summary.variant !== "completed") return null;
    const entry = getJournalEntry(summary.journalId);
    if (entry?.kind === "workout") return buildPostWorkoutFacts(entry);
    return buildPostWorkoutFactsFromSummary({
      clientName: summary.clientName,
      title: summary.title,
      durationMin: summary.durationMin,
      filledSets: summary.filledSets,
      exerciseCount: summary.exerciseCount,
      volumeKg: summary.volumeKg,
      hint: summary.hint,
    });
  }, [phase, summary, getJournalEntry]);

  const resetWorkout = useCallback((): void => {
    dirtyEverRef.current = false;
    clearOverviewWorkoutDraft();
    router.replace("/start-workout");
  }, [clearOverviewWorkoutDraft, router]);

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

  const addBlankExercise = useCallback((): void => {
    const exerciseId = newWorkoutId();
    const jumpToNewInFocus = focusMode;
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
      if (jumpToNewInFocus && nextExercises.length > 0) {
        queueMicrotask(() => setFocusExerciseIdx(nextExercises.length - 1));
      }
      return {
        ...s,
        exercises: nextExercises,
      };
    });
  }, [focusMode]);

  const patchSet = useCallback((exerciseId: string, setId: string, patch: Partial<WorkoutSetRow>): void => {
    setSession((s) => ({
      ...s,
      exercises: s.exercises.map((ex) =>
        ex.id !== exerciseId
          ? ex
          : {
              ...ex,
              sets: ex.sets.map((row) => (row.id === setId ? { ...row, ...patch } : row)),
            },
      ),
    }));
  }, []);

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
    setSession((s) => ({
      ...s,
      exercises: [
        ...s.exercises,
        {
          id: exerciseId,
          name: trimmed,
          comment: "",
          skipped: false,
          sets: [createEmptySetRow()],
        },
      ],
    }));
  }, []);

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

  const jumpToExercise = useCallback((anchorId: string): void => {
    window.requestAnimationFrame(() => {
      document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

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
    if (finishSaveStartedRef.current) return;
    finishSaveStartedRef.current = true;
    dirtyEverRef.current = false;
    clearOverviewWorkoutDraft();
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
    void Promise.resolve(addCompletedWorkout(entry));
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
  }, [addCompletedWorkout, clearOverviewWorkoutDraft, clients, session]);

  const finalizeNoteSession = useCallback((): void => {
    if (finishSaveStartedRef.current) return;
    finishSaveStartedRef.current = true;
    dirtyEverRef.current = false;
    clearOverviewWorkoutDraft();
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
    void Promise.resolve(addNoteEntry(entry));
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
  }, [addNoteEntry, clearOverviewWorkoutDraft, session]);

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

  const rememberChips = useMemo(() => rememberChipsFromBlock(rememberBlock), [rememberBlock]);

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

        <section className="rounded-2xl border border-[color:var(--border-soft)] bg-[var(--tg-card)] p-4">
          <p className="text-lg font-semibold text-[var(--text-primary)]">{summary.clientName}</p>
          <p className="mt-0.5 text-sm text-[var(--tg-muted)]">{summary.title}</p>
          <p className="mt-3 text-sm text-[var(--tg-muted)]">Длительность: {summary.durationMin} мин</p>

          {summary.variant === "completed" ? (
            <>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <div className="rounded-xl bg-[var(--tg-bg)] px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase text-[var(--tg-muted)]">Подходы</p>
                  <p className="font-semibold tabular-nums text-[var(--text-primary)]">{summary.filledSets}</p>
                </div>
                <div className="rounded-xl bg-[var(--tg-bg)] px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase text-[var(--tg-muted)]">Упражнений</p>
                  <p className="font-semibold tabular-nums text-[var(--text-primary)]">{summary.exerciseCount}</p>
                </div>
                <div className="rounded-xl bg-[var(--tg-bg)] px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase text-[var(--tg-muted)]">Объём</p>
                  <p className="font-semibold tabular-nums text-[var(--text-primary)]">
                    {formatSummaryVolumeCell(summary.volumeKg, summary.filledSets)}
                  </p>
                </div>
              </div>
              <p className="mt-3 rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3 py-2 text-sm leading-snug text-[var(--tg-text)]">
                {summary.hint}
              </p>
              <p className="mt-3 text-xs text-[var(--tg-muted)]">
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
            className="app-btn rounded-2xl bg-[var(--tg-accent)] px-4 py-3 text-center text-[15px] font-semibold text-white shadow-app-primary"
            prefetch={false}
          >
            Открыть запись
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-[color:var(--border-soft)] pt-3 text-sm">
            <Link href="/journal" prefetch={false} className="font-medium text-[var(--tg-accent)]">
              В журнал
            </Link>
            {!isNote ? (
              <Link
                href={`/clients/${encodeURIComponent(summary.clientId)}`}
                prefetch={false}
                className="font-medium text-[var(--tg-accent)]"
              >
                К клиенту
              </Link>
            ) : null}
            <button
              type="button"
              className="font-medium text-[var(--tg-accent)] underline-offset-2 hover:underline"
              onClick={resetWorkout}
            >
              Новая тренировка
            </button>
          </div>
        </div>

        {summary.variant === "completed" && summaryAiFactsCompleted ? (
          <details className="rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-card)]/60 px-3 py-2">
            <summary className="cursor-pointer text-sm font-medium text-[var(--text-muted)]">
              Сообщение клиенту — черновик, не отправляется
            </summary>
            <div className="mt-3 space-y-3 pb-1">
              <ContextualAiHelper
                variant="compact"
                heading="Итог тренировки"
                facts={summaryAiFactsCompleted}
                generateKind="post_workout_summary"
                generateLabel="Сформулировать"
              />
              <ContextualAiHelper
                variant="compact"
                heading="Текст для клиента"
                facts={summaryAiFactsCompleted}
                generateKind="telegram_session_followup"
                generateLabel="Сформулировать"
              />
            </div>
          </details>
        ) : null}
      </main>
    );
  }

  return (
    <>
      <main className={`flex w-full flex-col gap-3 px-3 py-3 ${mainBottomPad} sm:px-4`}>
        <header className="flex flex-col gap-2 border-b border-[color:var(--border-soft)] pb-2">
          <div className="flex items-center justify-between gap-2">
            <p className="min-w-0 truncate text-xs font-medium text-[var(--tg-muted)]">{session.clientName}</p>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <span className="font-mono text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                {formatElapsed(elapsedMs)}
              </span>
              <span className="rounded-full bg-[var(--tg-bg)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--tg-muted)]">
                {draftStatusShort}
              </span>
              {session.exercises.length > 0 ? (
                <button
                  type="button"
                  className="rounded-full border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)]"
                  onClick={() => {
                    setFocusMode((m) => !m);
                    setFocusExerciseIdx(0);
                  }}
                >
                  {focusMode ? "Все" : "Фокус"}
                </button>
              ) : null}
            </div>
          </div>
          {dirty ? (
            <p className="text-[10px] leading-snug text-[var(--tg-muted)]">
              Черновик хранится только в этой вкладке браузера.
            </p>
          ) : null}
          <label className="sr-only" htmlFor="workout-title-input">
            Название тренировки
          </label>
          <input
            id="workout-title-input"
            value={session.title}
            onChange={(e) => setSession((s) => ({ ...s, title: e.target.value }))}
            className="w-full truncate rounded-lg border border-transparent bg-transparent py-0.5 font-display text-[17px] font-semibold leading-tight text-[var(--text-primary)] outline-none focus:border-[color:var(--border-soft)]"
          />

          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--tg-muted)]">Учесть:</span>
            {rememberChips.visible.length === 0 ? (
              <span className="text-xs text-[var(--tg-muted)]">—</span>
            ) : (
              rememberChips.visible.map((c, i) => (
                <span
                  key={`${i}-${c.slice(0, 20)}`}
                  className="rounded-full border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-primary)]"
                >
                  {c}
                </span>
              ))
            )}
            {rememberChips.extra > 0 ? (
              <span className="text-[11px] font-semibold text-[var(--tg-accent)]">+{rememberChips.extra}</span>
            ) : null}
          </div>
        </header>

        {session.exercises.length === 0 ? (
          <Card className="border-dashed border-[color:var(--border-strong)] px-4 py-5">
            <p className="font-medium text-[var(--text-primary)]">Добавьте первое упражнение</p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--tg-muted)]">
              Так тренировка начнётся с чистой структуры.
            </p>
            <button
              type="button"
              className="app-btn mt-4 w-full rounded-2xl bg-[var(--tg-accent)] px-4 py-3 text-white shadow-app-primary"
              onClick={addBlankExercise}
            >
              Добавить упражнение
            </button>
          </Card>
        ) : (
          <>
            <section className="flex flex-col gap-3">
              {(focusMode && session.exercises[focusIdxSafe]
                ? [session.exercises[focusIdxSafe]]
                : session.exercises
              ).map((exercise) => {
                  if (!exercise) return null;
                  const hints = demoExerciseCardHints[exercise.id];
                  const nameKey = exercise.name.trim();
                  const journalHist =
                    nameKey.length > 0 ? getExerciseHistoryForClient(session.clientId, nameKey) : null;
                  return (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      previousText={
                        referenceHints[exercise.name] ?? journalHist?.previousSummary ?? hints?.previous ?? ""
                      }
                      bestText={journalHist?.bestSummary ?? hints?.best ?? null}
                      scrollAnchorId={`ex-${exercise.id}`}
                      onExercisePatch={(patch) => patchExercise(exercise.id, patch)}
                      onSetChange={(setId, patch) => patchSet(exercise.id, setId, patch)}
                      onRequestDeleteSet={(rowId) => requestDeleteSet(exercise.id, rowId)}
                      onOpenHistory={() => setHistoryExerciseId(exercise.id)}
                      onOpenMore={() => setMoreExerciseId(exercise.id)}
                    />
                  );
                },
              )}
            </section>
            {focusMode && session.exercises.length > 1 ? (
              <div className="flex items-center justify-between gap-2 rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-card)]/80 px-3 py-2">
                <button
                  type="button"
                  className="app-btn rounded-lg border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] disabled:opacity-40"
                  disabled={focusIdxSafe <= 0}
                  onClick={() => setFocusExerciseIdx(focusIdxSafe - 1)}
                >
                  Назад
                </button>
                <span className="text-xs font-semibold tabular-nums text-[var(--tg-muted)]">
                  {focusIdxSafe + 1} / {session.exercises.length}
                </span>
                <button
                  type="button"
                  className="app-btn rounded-lg border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] disabled:opacity-40"
                  disabled={focusIdxSafe >= session.exercises.length - 1}
                  onClick={() => setFocusExerciseIdx(focusIdxSafe + 1)}
                >
                  Дальше
                </button>
              </div>
            ) : null}
            {!focusMode ? (
              <button
                type="button"
                className="app-btn w-full rounded-xl border border-[color:color-mix(in_srgb,var(--tg-accent),transparent_45%)] bg-[color:color-mix(in_srgb,var(--tg-accent),transparent_92%)] py-2.5 text-sm font-bold text-[var(--tg-accent)]"
                onClick={() => addBlankExercise()}
              >
                + Упражнение
              </button>
            ) : (
              <button
                type="button"
                className="app-btn w-full rounded-xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] py-2.5 text-sm font-semibold text-[var(--text-primary)]"
                onClick={() => addBlankExercise()}
              >
                + Упражнение
              </button>
            )}
          </>
        )}

        <section className="rounded-xl border border-[color:var(--border-soft)] bg-[color:color-mix(in_srgb,var(--tg-card),transparent_40%)] px-3 py-2">
          <label className="sr-only" htmlFor="session-comment">
            Комментарий к тренировке
          </label>
          <textarea
            id="session-comment"
            rows={session.workoutComment.trim().length > 0 ? 3 : 2}
            placeholder="Комментарий к тренировке"
            value={session.workoutComment}
            onChange={(e) => setSession((s) => ({ ...s, workoutComment: e.target.value }))}
            className="w-full resize-none border-0 bg-transparent py-1 text-sm text-[var(--tg-text)] placeholder:text-[var(--tg-muted)] outline-none"
          />
        </section>
      </main>

      <div className="fixed bottom-[calc(5.5rem+max(0.35rem,env(safe-area-inset-bottom,0px)))] left-1/2 z-40 flex w-full max-w-[min(100%,480px)] -translate-x-1/2 flex-col gap-2 border-t border-[color:var(--border-soft)] bg-[color:color-mix(in_srgb,var(--tg-bar),black_12%)]/95 px-3 py-2 backdrop-blur-md supports-[backdrop-filter]:bg-[color:color-mix(in_srgb,var(--tg-bar),black_8%)]/88">
        {hasExercisesForFooter ? (
          <div className="rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)]/90 px-2 py-1.5">
            {restTimerActive ? (
              <div className="flex items-center justify-between gap-2 px-1 py-0.5">
                <span className="font-mono text-xl font-bold tabular-nums text-[var(--text-primary)] sm:text-2xl">
                  {restSecondsRemaining}
                </span>
                <span className="text-center text-[11px] text-[var(--tg-muted)]">Отдых, сек</span>
                <button
                  type="button"
                  className="shrink-0 text-xs font-semibold text-[var(--tg-accent)]"
                  onClick={() => setRestSecondsRemaining(null)}
                >
                  Пропустить
                </button>
              </div>
            ) : (
              <details className="group">
                <summary className="cursor-pointer list-none px-1 py-1 text-[11px] font-medium text-[var(--tg-muted)] marker:hidden [&::-webkit-details-marker]:hidden">
                  <span className="text-[var(--text-secondary)]">Отдых</span>
                  <span className="ml-1 text-[10px] text-[var(--tg-muted)]">· таймер</span>
                </summary>
                <div className="flex flex-wrap items-center gap-1.5 border-t border-[color:var(--border-soft)] px-1 pb-1 pt-2">
                  {[60, 90, 120].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      className="rounded-lg border border-[color:var(--border-strong)] bg-[var(--tg-card)] px-2 py-1 text-[11px] font-bold tabular-nums text-[var(--text-primary)]"
                      onClick={() => setRestSecondsRemaining(sec)}
                    >
                      {sec} с
                    </button>
                  ))}
                </div>
              </details>
            )}
          </div>
        ) : null}
        <div className="flex items-stretch gap-2">
          <button
            type="button"
            className="app-btn shrink-0 rounded-xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-3 py-2.5 text-sm font-semibold text-[var(--text-primary)]"
            onClick={() => setStructureOpen(true)}
          >
            Структура
          </button>
          <button
            type="button"
            className="app-btn min-w-0 flex-1 rounded-xl bg-[var(--tg-accent)] py-3.5 text-base font-bold text-white shadow-[0_6px_20px_rgba(0,0,0,0.25)]"
            onClick={openFinishFlow}
          >
            Завершить
          </button>
        </div>
      </div>

      <StructureSheet
        open={structureOpen}
        onClose={() => setStructureOpen(false)}
        exercises={session.exercises}
        onJumpToExercise={jumpToExercise}
        onAddExercise={addExerciseWithName}
        onRenameExercise={(id, name) => patchExercise(id, { name })}
        onRequestDeleteExercise={requestDeleteExerciseFromStructure}
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
            <h2 className="text-lg font-semibold">Завершить тренировку?</h2>
            <p className="mt-3 text-sm text-[var(--tg-muted)]">
              Упражнений: {countNonSkippedExercises(session.exercises)} · Заполненных подходов:{" "}
              {countFilledSetsWorkout(session.exercises)} · Время:{" "}
              {Math.max(1, Math.round(elapsedMs / 60_000))} мин
            </p>
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
                className="app-btn rounded-2xl bg-[var(--tg-accent)] px-4 py-3 text-white shadow-app-primary"
                onClick={() => {
                  finalizeCompletedWorkout();
                }}
              >
                Сохранить в журнал
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
    </>
  );
}

export function WorkoutLogger(): ReactElement {
  const { consumeWorkoutBootstrap } = useMockApp();
  const [bootstrap, setBootstrap] = useState<WorkoutLoggerBootstrap | null | undefined>(undefined);

  useLayoutEffect(() => {
    // Очередь bootstrap живёт в ref провайдера; переносим в state один раз за монтирование страницы.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- синхронизация с ref-очередью при входе на /workout
    setBootstrap(consumeWorkoutBootstrap());
  }, [consumeWorkoutBootstrap]);

  if (bootstrap === undefined) {
    return (
      <main className="flex min-h-[40vh] w-full flex-col items-center justify-center gap-2 px-4 py-10">
        <p className="text-sm text-[var(--tg-muted)]">Подготовка тренировки…</p>
      </main>
    );
  }

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
