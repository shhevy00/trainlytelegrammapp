"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { recomputeJournalWorkoutStats } from "@/lib/journal/journalEntryStats";
import {
  validateJournalNoteUpdate,
  validateJournalWorkoutUpdate,
  type JournalNoteUpdateInput,
  type JournalWorkoutUpdateInput,
} from "@/lib/journal/validateJournalUpdate";
import type { JournalCompletedWorkout, JournalEntry, JournalNoteEntry } from "@/lib/types";
import {
  normalizeTemplateName,
  validateTemplateInput,
  validateUpdateWorkoutTemplateInput,
  type CreateWorkoutTemplateInput,
  type UpdateWorkoutTemplateInput,
  type WorkoutLoggerBootstrap,
  type WorkoutTemplate,
  type WorkoutTemplateExercise,
} from "@/lib/workout/templates";
import { createWorkoutBootstrapFromTemplate as resolveBootstrapFromTemplate } from "@/lib/workout/workoutBootstrapFromTemplate";
import {
  useWorkoutBootstrapBridge,
  type OverviewDraftPreview,
} from "@/lib/workout/useWorkoutBootstrapBridge";
import {
  INITIAL_SCHEDULE_ITEMS,
  MOCK_TODAY_ISO,
  mockClients,
  type MockClient,
  type MockScheduleItem,
} from "@/lib/mock/data";
import type { ExerciseHistoryDemo } from "@/lib/mock/workoutDemo";
import { buildExerciseHistoryFromJournal } from "@/lib/journal/exerciseHistoryFromJournal";
import { formatOverviewHumanDate, isoDayLocal } from "@/lib/overview/dailyOperations";
import type { CoachPaymentRecord, CoachQuickNote, CoachQuickNoteType } from "@/lib/mock/coachLedger";
import { buildSeedCoachPaymentRecordsToday } from "@/lib/mock/coachLedgerSeed";
import { buildInitialJournalEntries } from "@/lib/mock/journalSeed";
import { spendOneClientSessionBalance } from "@/lib/coach/paidSessions";
import { buildRepeatSessionFromSavedWorkout } from "@/lib/workout/repeatFromJournal";
import { newWorkoutId } from "@/lib/workout/ids";
import {
  createFreshMockLifecycle,
  DEFAULT_MOCK_LIFECYCLE,
  persistLifecycleToStorage,
  readLifecycleFromStorage,
  type CompleteProfileSetupInput,
  type MockLifecyclePersisted,
  type MockSubscriptionStatus,
} from "@/lib/mock/lifecycleTypes";

export type { WorkoutLoggerBootstrap, WorkoutLoggerStartSource } from "@/lib/workout/templates";

export type {
  CompleteProfileSetupInput,
  MockAuthStatus,
  MockLegalStatus,
  MockLifecyclePersisted,
  MockOnboardingStatus,
  MockProfileSetupStatus,
  MockSubscriptionStatus,
  MockTrainerProfile,
} from "@/lib/mock/lifecycleTypes";

export type { OverviewDraftPreview } from "@/lib/workout/useWorkoutBootstrapBridge";

function clientHasUpcomingSchedule(
  items: readonly MockScheduleItem[],
  clientId: string,
  excludeSlotId: string | undefined,
  fromDayIso: string,
): boolean {
  return items.some((s) => {
    if (s.clientId !== clientId) return false;
    if (excludeSlotId && s.id === excludeSlotId) return false;
    if (s.status !== "planned" && s.status !== "upcoming") return false;
    return s.date >= fromDayIso;
  });
}

const SEED_TEMPLATE_DATE_ISO = "2026-05-01";

/** Начальные шаблоны тренировки (mock) для c1 Anna и c4 Dmitry. */
function buildSeedWorkoutTemplates(): WorkoutTemplate[] {
  return [
    {
      id: "wt-seed-c1-legs",
      clientId: "c1",
      name: "Ноги",
      description: "Шаблон тренировки: ноги",
      createdAtIso: SEED_TEMPLATE_DATE_ISO,
      updatedAtIso: SEED_TEMPLATE_DATE_ISO,
      archivedAtIso: null,
      exercises: [
        {
          id: "wte-seed-c1-legs-1",
          templateId: "wt-seed-c1-legs",
          name: "Жим ногами",
          orderIndex: 0,
          plannedSets: 3,
        },
        {
          id: "wte-seed-c1-legs-2",
          templateId: "wt-seed-c1-legs",
          name: "Румынская тяга",
          orderIndex: 1,
          plannedSets: 3,
        },
        {
          id: "wte-seed-c1-legs-3",
          templateId: "wt-seed-c1-legs",
          name: "Разгибание ног",
          orderIndex: 2,
          plannedSets: 2,
        },
      ],
    },
    {
      id: "wt-seed-c1-mob",
      clientId: "c1",
      name: "Мобильность",
      createdAtIso: SEED_TEMPLATE_DATE_ISO,
      updatedAtIso: SEED_TEMPLATE_DATE_ISO,
      archivedAtIso: null,
      exercises: [
        {
          id: "wte-seed-c1-mob-1",
          templateId: "wt-seed-c1-mob",
          name: "Мобильность таза",
          orderIndex: 0,
          plannedSets: 1,
        },
        {
          id: "wte-seed-c1-mob-2",
          templateId: "wt-seed-c1-mob",
          name: "Ягодичный мостик",
          orderIndex: 1,
          plannedSets: 2,
        },
      ],
    },
    {
      id: "wt-seed-c4-end",
      clientId: "c4",
      name: "Круг выносливости",
      createdAtIso: SEED_TEMPLATE_DATE_ISO,
      updatedAtIso: SEED_TEMPLATE_DATE_ISO,
      archivedAtIso: null,
      exercises: [
        {
          id: "wte-seed-c4-end-1",
          templateId: "wt-seed-c4-end",
          name: "Вело интервалы",
          orderIndex: 0,
          plannedSets: 1,
        },
        {
          id: "wte-seed-c4-end-2",
          templateId: "wt-seed-c4-end",
          name: "Приседание с весом тела",
          orderIndex: 1,
          plannedSets: 3,
        },
        {
          id: "wte-seed-c4-end-3",
          templateId: "wt-seed-c4-end",
          name: "Планка",
          orderIndex: 2,
          plannedSets: 3,
        },
      ],
    },
  ];
}

/** Синхронно в mock и может быть async в Live (PostgreSQL). */
type MaybeAsync<T> = T | Promise<T>;

interface MockAppContextValue {
  /** Календарный «сегодня» для UI (mock: фиксированная дата; live: из снимка БД). */
  todayIso: string;
  clients: MockClient[];
  journalEntries: JournalEntry[];
  scheduleItems: MockScheduleItem[];
  addClient: (payload: {
    name: string;
    goal?: string;
    remainingSessions?: number;
    limitation?: string;
  }) => MaybeAsync<string>;
  getExerciseHistoryForClient: (clientId: string, exerciseName: string) => ExerciseHistoryDemo | null;
  addCompletedWorkout: (entry: JournalCompletedWorkout) => MaybeAsync<void>;
  addNoteEntry: (entry: JournalNoteEntry) => MaybeAsync<void>;
  updateJournalWorkout: (
    id: string,
    input: JournalWorkoutUpdateInput,
  ) => MaybeAsync<{ ok: true } | { ok: false; errors: string[] }>;
  updateJournalNote: (
    id: string,
    input: JournalNoteUpdateInput,
  ) => MaybeAsync<{ ok: true } | { ok: false; errors: string[] }>;
  getJournalEntry: (id: string) => JournalEntry | undefined;
  getScheduleItemById: (id: string) => MockScheduleItem | undefined;
  getScheduleItemsByDate: (dateIso: string) => MockScheduleItem[];
  getTodayScheduleItems: (todayIso: string) => MockScheduleItem[];
  markScheduleMissed: (scheduleItemId: string) => MaybeAsync<void>;
  markScheduleCancelled: (scheduleItemId: string) => MaybeAsync<void>;
  /** Mock: новая запись в графике (только в памяти вкладки). */
  addScheduleSlot: (payload: {
    clientId: string;
    clientName: string;
    dateIso: string;
    time: string;
    title: string;
    durationMinutes: number;
    templateId?: string;
  }) => MaybeAsync<{ ok: true; id: string } | { ok: false; error: string }>;
  /** Возвращает false, если запись не найдена, не тренировка или нет упражнений (legacy). */
  prepareRepeatFromWorkout: (workoutId: string) => boolean;
  consumeWorkoutBootstrap: () => WorkoutLoggerBootstrap | null;
  queueWorkoutBootstrap: (bootstrap: WorkoutLoggerBootstrap) => void;
  getLatestCompletedWorkoutWithStructure: (clientId: string) => JournalCompletedWorkout | undefined;
  /** Журнал клиента, новее первым (mock). */
  getJournalEntriesForClient: (clientId: string) => JournalEntry[];
  /** Черновик активной тренировки (см. sync из WorkoutLogger). */
  overviewDraftPreview: OverviewDraftPreview | null;
  syncOverviewWorkoutDraft: (bootstrap: WorkoutLoggerBootstrap | null) => void;
  clearOverviewWorkoutDraft: () => void;
  /** Ставит bootstrap черновика в очередь логгера. Возвращает false, если черновика нет. */
  consumeOverviewDraftBootstrap: () => boolean;
  coachPaymentRecords: CoachPaymentRecord[];
  coachQuickNotes: CoachQuickNote[];
  recordCoachPayment: (payload: {
    clientId: string;
    clientName: string;
    sessionsAdded: number;
    amountRub: number | null;
    comment: string | null;
  }) => MaybeAsync<void>;
  addCoachQuickNote: (payload: {
    clientId: string;
    clientName: string;
    type: CoachQuickNoteType;
    text: string;
  }) => MaybeAsync<void>;
  getCoachQuickNotesForClient: (clientId: string) => CoachQuickNote[];
  getCoachPaymentRecordsForClient: (clientId: string) => CoachPaymentRecord[];
  /** Шаблоны тренировки (MVP: только по клиенту, mock в памяти). */
  getTemplatesForClient: (clientId: string) => WorkoutTemplate[];
  getTemplateById: (templateId: string) => WorkoutTemplate | undefined;
  createWorkoutTemplate: (
    input: CreateWorkoutTemplateInput,
  ) => MaybeAsync<{ ok: true; template: WorkoutTemplate } | { ok: false; errors: string[] }>;
  updateWorkoutTemplate: (
    templateId: string,
    input: UpdateWorkoutTemplateInput,
  ) => MaybeAsync<{ ok: true; template: WorkoutTemplate } | { ok: false; errors: string[] }>;
  archiveWorkoutTemplate: (templateId: string) => MaybeAsync<{ ok: true } | { ok: false; error: string }>;
  createWorkoutBootstrapFromTemplate: (params: {
    clientId: string;
    templateId: string;
    scheduleItemId?: string;
    titleOverride?: string;
    /** Передаётся из экрана старта при подтверждении ведения в долг. */
    debtAcknowledged?: boolean;
  }) => { ok: true } | { ok: false; error: string };
  /** Сохранить завершённую тренировку как новый шаблон тренировки (только структура). */
  saveWorkoutAsTemplate: (params: {
    workoutId: string;
    name: string;
  }) => MaybeAsync<{ ok: true; template: WorkoutTemplate } | { ok: false; errors: string[] }>;
  /** PROD-SHELL-2: демо-жизненный цикл (localStorage, не безопасность). */
  mockLifecycle: MockLifecyclePersisted;
  enterDemoAuth: () => MaybeAsync<void>;
  acceptLegalMock: () => MaybeAsync<void>;
  completeProfileSetupMock: (input: CompleteProfileSetupInput) => MaybeAsync<void>;
  markOnboardingSeen: () => MaybeAsync<void>;
  setMockSubscriptionStatus: (status: MockSubscriptionStatus) => MaybeAsync<void>;
  resetMockLifecycle: () => MaybeAsync<void>;
  /** Live/PostgreSQL: автосохранение черновика тренировки. В mock — no-op. */
  saveWorkoutDraft: (payload: {
    workoutId: string;
    session: import("@/lib/workout/types").WorkoutSessionState;
    status: "draft" | "in_progress";
    templateId?: string | null;
  }) => MaybeAsync<{ ok: true } | { ok: false; error: string; conflictWorkoutId?: string }>;
  loadWorkoutDraft: (
    clientId: string,
  ) => MaybeAsync<{
    workoutId: string;
    session: import("@/lib/workout/types").WorkoutSessionState;
    status: "draft" | "in_progress";
    templateId: string | null;
    clientName: string;
  } | null>;
  discardWorkoutDraft: (workoutId: string) => MaybeAsync<void>;
}

export const MockAppContext = createContext<MockAppContextValue | null>(null);

export type { MockAppContextValue };

export function MockAppProvider({ children }: { children: ReactNode }): ReactElement {
  const [clients, setClients] = useState<MockClient[]>(() => mockClients.map((c) => ({ ...c })));
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => buildInitialJournalEntries());
  const [coachPaymentRecords, setCoachPaymentRecords] = useState<CoachPaymentRecord[]>(() =>
    buildSeedCoachPaymentRecordsToday(),
  );
  const [coachQuickNotes, setCoachQuickNotes] = useState<CoachQuickNote[]>([]);
  const [scheduleItems, setScheduleItems] = useState<MockScheduleItem[]>(() =>
    structuredClone(INITIAL_SCHEDULE_ITEMS),
  );
  const scheduleItemsRef = useRef(scheduleItems);
  useEffect(() => {
    scheduleItemsRef.current = scheduleItems;
  }, [scheduleItems]);
  const {
    overviewDraftPreview,
    consumeWorkoutBootstrap,
    queueWorkoutBootstrap,
    syncOverviewWorkoutDraft,
    clearOverviewWorkoutDraft,
    consumeOverviewDraftBootstrap,
  } = useWorkoutBootstrapBridge();
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>(() =>
    buildSeedWorkoutTemplates(),
  );


  const [mockLifecycle, setMockLifecycle] = useState<MockLifecyclePersisted>(() => DEFAULT_MOCK_LIFECYCLE);

  useEffect(() => {
    const fromStorage = readLifecycleFromStorage();
    if (fromStorage) {
      // Однократное чтение localStorage после монтирования на клиенте (SSR не видит window).
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mock lifecycle hydration only
      setMockLifecycle(fromStorage);
    }
  }, []);

  const enterDemoAuth = useCallback((): void => {
    setMockLifecycle((prev) => {
      const next: MockLifecyclePersisted = { ...prev, mockAuthStatus: "authenticated_demo" };
      persistLifecycleToStorage(next);
      return next;
    });
  }, []);

  const acceptLegalMock = useCallback((): void => {
    setMockLifecycle((prev) => {
      const next: MockLifecyclePersisted = { ...prev, mockLegalStatus: "accepted" };
      persistLifecycleToStorage(next);
      return next;
    });
  }, []);

  const completeProfileSetupMock = useCallback((input: CompleteProfileSetupInput): void => {
    setMockLifecycle((prev) => {
      const next: MockLifecyclePersisted = {
        ...prev,
        mockProfileSetupStatus: "completed",
        trainerProfile: {
          displayName: input.displayName.trim(),
          specialization: input.specialization?.trim() || undefined,
          city: input.city?.trim() || undefined,
          timezone: input.timezone,
          currency: input.currency,
        },
      };
      persistLifecycleToStorage(next);
      return next;
    });
  }, []);

  const markOnboardingSeen = useCallback((): void => {
    setMockLifecycle((prev) => {
      const next: MockLifecyclePersisted = { ...prev, mockOnboardingStatus: "seen" };
      persistLifecycleToStorage(next);
      return next;
    });
  }, []);

  const setMockSubscriptionStatus = useCallback((status: MockSubscriptionStatus): void => {
    setMockLifecycle((prev) => {
      const next: MockLifecyclePersisted = { ...prev, mockSubscriptionStatus: status };
      persistLifecycleToStorage(next);
      return next;
    });
  }, []);

  const resetMockLifecycle = useCallback((): void => {
    const next = createFreshMockLifecycle();
    persistLifecycleToStorage(next);
    setMockLifecycle(next);
  }, []);

  const addClient = useCallback(
    (payload: {
      name: string;
      goal?: string;
      remainingSessions?: number;
      limitation?: string;
    }): string => {
      const id = `c-${newWorkoutId().replace(/-/g, "").slice(0, 12)}`;
      const client: MockClient = {
        id,
        name: payload.name.trim(),
        goal: payload.goal?.trim() || undefined,
        remainingSessions: payload.remainingSessions ?? 0,
        limitation: payload.limitation?.trim() || undefined,
        lastWorkoutSummary: undefined,
        inactiveDays: 0,
        hasWorkoutToday: false,
        hasNextWorkoutScheduled: false,
        completedWorkoutsCount: 0,
      };
      setClients((prev) => [...prev, client]);
      return id;
    },
    [],
  );

  const getExerciseHistoryForClient = useCallback(
    (clientId: string, exerciseName: string): ExerciseHistoryDemo | null =>
      buildExerciseHistoryFromJournal(journalEntries, clientId, exerciseName, MOCK_TODAY_ISO),
    [journalEntries],
  );

  const addCompletedWorkout = useCallback((entry: JournalCompletedWorkout) => {
    setJournalEntries((prev) => [entry, ...prev]);
    const dayIso = isoDayLocal(entry.createdAtMs);
    const relDay = formatOverviewHumanDate(dayIso, MOCK_TODAY_ISO);
    const lastSummary = `${relDay} · ${entry.title}`;

    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== entry.clientId) return c;
        const hasNext = clientHasUpcomingSchedule(
          scheduleItemsRef.current,
          c.id,
          entry.scheduleItemId,
          dayIso,
        );
        return {
          ...c,
          remainingSessions: spendOneClientSessionBalance(c.remainingSessions),
          lastWorkoutSummary: lastSummary,
          completedWorkoutsCount: c.completedWorkoutsCount + 1,
          inactiveDays: 0,
          hasWorkoutToday: dayIso === MOCK_TODAY_ISO,
          hasNextWorkoutScheduled: hasNext,
        };
      }),
    );

    if (!entry.scheduleItemId) return;
    setScheduleItems((prev) =>
      prev.map((s) => {
        if (s.id !== entry.scheduleItemId) return s;
        if (s.status !== "planned" && s.status !== "upcoming") return s;
        return { ...s, status: "completed" as const, workoutId: entry.id };
      }),
    );
  }, []);

  const addNoteEntry = useCallback((entry: JournalNoteEntry) => {
    setJournalEntries((prev) => [entry, ...prev]);
  }, []);

  const updateJournalWorkout = useCallback(
    (
      id: string,
      input: JournalWorkoutUpdateInput,
    ): { ok: true } | { ok: false; errors: string[] } => {
      const errors = validateJournalWorkoutUpdate(input);
      if (errors.length > 0) return { ok: false, errors };
      let found = false;
      const stats = recomputeJournalWorkoutStats(input.exercises);
      setJournalEntries((prev) =>
        prev.map((e) => {
          if (e.id !== id || e.kind !== "workout") return e;
          found = true;
          return {
            ...e,
            title: input.title.trim(),
            durationMin: Math.max(1, Math.round(input.durationMin)),
            workoutComment: input.workoutComment,
            exercises: structuredClone(input.exercises),
            ...stats,
          };
        }),
      );
      if (!found) return { ok: false, errors: ["Запись не найдена."] };
      return { ok: true };
    },
    [],
  );

  const updateJournalNote = useCallback(
    (id: string, input: JournalNoteUpdateInput): { ok: true } | { ok: false; errors: string[] } => {
      const errors = validateJournalNoteUpdate(input);
      if (errors.length > 0) return { ok: false, errors };
      let found = false;
      setJournalEntries((prev) =>
        prev.map((e) => {
          if (e.id !== id || e.kind !== "note") return e;
          found = true;
          return {
            ...e,
            title: input.title.trim(),
            durationMin: Math.max(1, Math.round(input.durationMin)),
            workoutComment: input.workoutComment,
          };
        }),
      );
      if (!found) return { ok: false, errors: ["Запись не найдена."] };
      return { ok: true };
    },
    [],
  );

  const getJournalEntry = useCallback(
    (id: string): JournalEntry | undefined => journalEntries.find((e) => e.id === id),
    [journalEntries],
  );

  const getScheduleItemById = useCallback(
    (id: string): MockScheduleItem | undefined => scheduleItems.find((s) => s.id === id),
    [scheduleItems],
  );

  const getScheduleItemsByDate = useCallback(
    (dateIso: string): MockScheduleItem[] =>
      scheduleItems
        .filter((s) => s.date === dateIso)
        .slice()
        .sort((a, b) => a.time.localeCompare(b.time)),
    [scheduleItems],
  );

  const getTodayScheduleItems = useCallback(
    (todayIso: string): MockScheduleItem[] => getScheduleItemsByDate(todayIso),
    [getScheduleItemsByDate],
  );

  const markScheduleMissed = useCallback((scheduleItemId: string): void => {
    setScheduleItems((prev) =>
      prev.map((s) => {
        if (s.id !== scheduleItemId) return s;
        if (s.status !== "planned" && s.status !== "upcoming") return s;
        return { ...s, status: "missed" as const };
      }),
    );
  }, []);

  const markScheduleCancelled = useCallback((scheduleItemId: string): void => {
    setScheduleItems((prev) =>
      prev.map((s) => {
        if (s.id !== scheduleItemId) return s;
        if (s.status !== "planned" && s.status !== "upcoming") return s;
        return { ...s, status: "cancelled" as const };
      }),
    );
  }, []);

  const addScheduleSlot = useCallback(
    (payload: {
      clientId: string;
      clientName: string;
      dateIso: string;
      time: string;
      title: string;
      durationMinutes: number;
      templateId?: string;
    }): { ok: true; id: string } | { ok: false; error: string } => {
      let slotTemplateId: string | undefined;
      let slotTemplateName: string | undefined;

      if (payload.templateId && payload.templateId.trim().length > 0) {
        const tid = payload.templateId.trim();
        const t = workoutTemplates.find((x) => x.id === tid);
        if (!t) return { ok: false, error: "Шаблон тренировки не найден." };
        if (t.archivedAtIso) {
          return { ok: false, error: "Этот шаблон в архиве — выберите другой или «Без шаблона»." };
        }
        if (t.clientId !== payload.clientId) {
          return { ok: false, error: "Шаблон не принадлежит выбранному клиенту." };
        }
        slotTemplateId = t.id;
        slotTemplateName = normalizeTemplateName(t.name);
      }

      const id = `s-${newWorkoutId().replace(/-/g, "").slice(0, 12)}`;
      const item: MockScheduleItem = {
        id,
        clientId: payload.clientId,
        clientName: payload.clientName.trim() || "Клиент",
        date: payload.dateIso,
        time: payload.time.trim(),
        durationMinutes: Math.max(15, Math.min(240, Math.round(payload.durationMinutes))),
        title: payload.title.trim() || "Тренировка",
        status: "planned",
        ...(slotTemplateId ? { templateId: slotTemplateId, templateName: slotTemplateName } : {}),
      };
      setScheduleItems((prev) => [...prev, item]);
      if (payload.dateIso >= MOCK_TODAY_ISO) {
        setClients((prev) =>
          prev.map((c) => (c.id === payload.clientId ? { ...c, hasNextWorkoutScheduled: true } : c)),
        );
      }
      return { ok: true, id };
    },
    [workoutTemplates],
  );

  const resolveClient = useCallback(
    (clientId: string): MockClient | undefined => clients.find((c) => c.id === clientId),
    [clients],
  );

  const getLatestCompletedWorkoutWithStructure = useCallback(
    (clientId: string): JournalCompletedWorkout | undefined => {
      const list = journalEntries.filter(
        (e): e is JournalCompletedWorkout =>
          e.kind === "workout" && e.clientId === clientId && e.exercises.length > 0,
      );
      list.sort((a, b) => b.createdAtMs - a.createdAtMs);
      return list[0];
    },
    [journalEntries],
  );

  const getJournalEntriesForClient = useCallback(
    (clientId: string): JournalEntry[] =>
      journalEntries
        .filter((e) => e.clientId === clientId)
        .sort((a, b) => b.createdAtMs - a.createdAtMs),
    [journalEntries],
  );

  const recordCoachPayment = useCallback(
    (payload: {
      clientId: string;
      clientName: string;
      sessionsAdded: number;
      amountRub: number | null;
      comment: string | null;
    }): void => {
      const createdAtMs = Date.now();
      const rec: CoachPaymentRecord = {
        id: newWorkoutId(),
        clientId: payload.clientId,
        clientName: payload.clientName,
        sessionsAdded: payload.sessionsAdded,
        amountRub: payload.amountRub,
        comment: payload.comment,
        createdAtMs,
      };
      const dateIso = new Date(createdAtMs).toISOString().slice(0, 10);
      const labelParts: string[] = [`+${payload.sessionsAdded} занятий`];
      if (payload.amountRub != null) labelParts.push(`${payload.amountRub} ₽`);
      if (payload.comment && payload.comment.trim()) labelParts.push(payload.comment.trim());
      const historyLabel = labelParts.join(" · ");
      const lastPaymentSummary = `${new Date(createdAtMs).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })} · ${historyLabel}`;
      setCoachPaymentRecords((prev) => [rec, ...prev]);
      setClients((prev) =>
        prev.map((c) => {
          if (c.id !== payload.clientId) return c;
          const prevHistory = c.paymentHistoryMock ? [...c.paymentHistoryMock] : [];
          prevHistory.unshift({ dateIso, label: historyLabel });
          const capped = prevHistory.slice(0, 20);
          return {
            ...c,
            remainingSessions: c.remainingSessions + payload.sessionsAdded,
            lastPaymentSummary,
            paymentHistoryMock: capped,
          };
        }),
      );
    },
    [],
  );

  const addCoachQuickNote = useCallback(
    (payload: {
      clientId: string;
      clientName: string;
      type: CoachQuickNoteType;
      text: string;
    }): void => {
      const note: CoachQuickNote = {
        id: newWorkoutId(),
        clientId: payload.clientId,
        clientName: payload.clientName,
        type: payload.type,
        text: payload.text.trim(),
        createdAtMs: Date.now(),
      };
      setCoachQuickNotes((prev) => [note, ...prev]);
    },
    [],
  );

  const getCoachQuickNotesForClient = useCallback(
    (clientId: string): CoachQuickNote[] =>
      coachQuickNotes.filter((n) => n.clientId === clientId).sort((a, b) => b.createdAtMs - a.createdAtMs),
    [coachQuickNotes],
  );

  const getCoachPaymentRecordsForClient = useCallback(
    (clientId: string): CoachPaymentRecord[] =>
      coachPaymentRecords.filter((r) => r.clientId === clientId).sort((a, b) => b.createdAtMs - a.createdAtMs),
    [coachPaymentRecords],
  );

  const getTemplatesForClient = useCallback(
    (clientId: string): WorkoutTemplate[] =>
      workoutTemplates
        .filter((t) => t.clientId === clientId && !t.archivedAtIso)
        .sort((a, b) => b.updatedAtIso.localeCompare(a.updatedAtIso) || a.name.localeCompare(b.name, "ru")),
    [workoutTemplates],
  );

  const getTemplateById = useCallback(
    (templateId: string): WorkoutTemplate | undefined => workoutTemplates.find((t) => t.id === templateId),
    [workoutTemplates],
  );

  const createWorkoutTemplate = useCallback(
    (input: CreateWorkoutTemplateInput): { ok: true; template: WorkoutTemplate } | { ok: false; errors: string[] } => {
      const errors = validateTemplateInput(input);
      if (errors.length > 0) return { ok: false, errors };
      if (!resolveClient(input.clientId)) return { ok: false, errors: ["Клиент не найден."] };
      const normalizedName = normalizeTemplateName(input.name);
      const nameTaken = workoutTemplates.some(
        (t) => t.clientId === input.clientId && !t.archivedAtIso && t.name === normalizedName,
      );
      if (nameTaken) {
        return { ok: false, errors: ["У этого клиента уже есть шаблон с таким названием."] };
      }
      const nowIso = new Date().toISOString();
      const templateId = `wt-${newWorkoutId().replace(/-/g, "").slice(0, 12)}`;
      const exercises: WorkoutTemplateExercise[] = input.exercises.map((row, orderIndex) => ({
        id: `wte-${newWorkoutId().replace(/-/g, "").slice(0, 10)}-${orderIndex}`,
        templateId,
        name: normalizeTemplateName(row.name),
        orderIndex,
        plannedSets: row.plannedSets,
        comment: row.comment?.trim() || undefined,
      }));
      const template: WorkoutTemplate = {
        id: templateId,
        clientId: input.clientId,
        name: normalizedName,
        description: input.description?.trim() || undefined,
        exercises,
        createdAtIso: nowIso,
        updatedAtIso: nowIso,
        archivedAtIso: null,
      };
      setWorkoutTemplates((prev) => [...prev, template]);
      return { ok: true, template };
    },
    [resolveClient, workoutTemplates],
  );

  const updateWorkoutTemplate = useCallback(
    (
      templateId: string,
      input: UpdateWorkoutTemplateInput,
    ): { ok: true; template: WorkoutTemplate } | { ok: false; errors: string[] } => {
      const cur = workoutTemplates.find((t) => t.id === templateId);
      if (!cur) return { ok: false, errors: ["Шаблон тренировки не найден."] };

      const partialErrors = validateUpdateWorkoutTemplateInput(input);
      if (partialErrors.length > 0) return { ok: false, errors: partialErrors };

      const mergedName = input.name !== undefined ? normalizeTemplateName(input.name) : cur.name;
      const mergedDescription =
        input.description !== undefined ? input.description.trim() || undefined : cur.description;
      const mergedExercises: WorkoutTemplateExercise[] =
        input.exercises !== undefined
          ? input.exercises.map((row, orderIndex) => {
              const existing = row.id ? cur.exercises.find((e) => e.id === row.id) : undefined;
              return {
                id: existing?.id ?? `wte-${newWorkoutId().replace(/-/g, "").slice(0, 10)}-${orderIndex}`,
                templateId,
                name: normalizeTemplateName(row.name),
                orderIndex,
                plannedSets: row.plannedSets,
                comment: row.comment?.trim() || undefined,
              };
            })
          : cur.exercises;

      const createLike: CreateWorkoutTemplateInput = {
        clientId: cur.clientId,
        name: mergedName,
        description: mergedDescription,
        exercises: mergedExercises.map((e) => ({
          name: e.name,
          plannedSets: e.plannedSets,
          comment: e.comment,
        })),
      };
      const fullErrors = validateTemplateInput(createLike);
      if (fullErrors.length > 0) return { ok: false, errors: fullErrors };

      const nameTaken = workoutTemplates.some(
        (t) =>
          t.id !== templateId &&
          t.clientId === cur.clientId &&
          !t.archivedAtIso &&
          t.name === mergedName,
      );
      if (nameTaken) {
        return { ok: false, errors: ["У этого клиента уже есть шаблон с таким названием."] };
      }

      const nowIso = new Date().toISOString();
      const next: WorkoutTemplate = {
        ...cur,
        name: mergedName,
        description: mergedDescription,
        exercises: mergedExercises,
        updatedAtIso: nowIso,
      };
      setWorkoutTemplates((prev) => prev.map((t) => (t.id === templateId ? next : t)));
      return { ok: true, template: next };
    },
    [workoutTemplates],
  );

  const archiveWorkoutTemplate = useCallback(
    (templateId: string): { ok: true } | { ok: false; error: string } => {
      const cur = workoutTemplates.find((t) => t.id === templateId);
      if (!cur) return { ok: false, error: "Шаблон тренировки не найден." };
      if (cur.archivedAtIso) return { ok: false, error: "Шаблон уже в архиве." };
      const nowIso = new Date().toISOString();
      setWorkoutTemplates((prev) =>
        prev.map((t) =>
          t.id === templateId ? { ...t, archivedAtIso: nowIso, updatedAtIso: nowIso } : t,
        ),
      );
      return { ok: true };
    },
    [workoutTemplates],
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
        template: workoutTemplates.find((t) => t.id === params.templateId),
      });
      if (!result.ok) return result;
      queueWorkoutBootstrap(result.bootstrap);
      return { ok: true };
    },
    [resolveClient, workoutTemplates, queueWorkoutBootstrap],
  );

  const saveWorkoutAsTemplate = useCallback(
    (params: {
      workoutId: string;
      name: string;
    }): { ok: true; template: WorkoutTemplate } | { ok: false; errors: string[] } => {
      const raw = journalEntries.find((e) => e.id === params.workoutId);
      if (!raw || raw.kind !== "workout") {
        return { ok: false, errors: ["Запись не найдена или это не тренировка."] };
      }
      const entry = raw;
      if (entry.exercises.length === 0) {
        return { ok: false, errors: ["Нет упражнений для сохранения в шаблон."] };
      }

      const exercisesForTemplate: CreateWorkoutTemplateInput["exercises"] = [];

      for (const ex of entry.exercises) {
        const nm = normalizeTemplateName(ex.name);
        const rowCount = ex.sets.length;

        if (nm.length === 0) {
          if (rowCount > 0) {
            return { ok: false, errors: ["В тренировке есть упражнение без названия."] };
          }
          continue;
        }

        const plannedSets = Math.min(Math.max(rowCount, 1), 20);
        const comment = ex.comment?.trim() || undefined;
        exercisesForTemplate.push({ name: nm, plannedSets, comment });
      }

      if (exercisesForTemplate.length === 0) {
        return { ok: false, errors: ["Нет упражнений с названием для шаблона."] };
      }

      const input: CreateWorkoutTemplateInput = {
        clientId: entry.clientId,
        name: params.name,
        exercises: exercisesForTemplate,
      };

      return createWorkoutTemplate(input);
    },
    [journalEntries, createWorkoutTemplate],
  );

  const prepareRepeatFromWorkout = useCallback(
    (workoutId: string): boolean => {
      const entry = journalEntries.find((e) => e.id === workoutId);
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
    [journalEntries, queueWorkoutBootstrap],
  );

  const saveWorkoutDraft = useCallback(
    async (payload: {
      workoutId: string;
      session: import("@/lib/workout/types").WorkoutSessionState;
      status: "draft" | "in_progress";
      templateId?: string | null;
    }): Promise<{ ok: true } | { ok: false; error: string; conflictWorkoutId?: string }> => {
      const { saveMockWorkoutDraft } = await import("@/lib/mock/mockWorkoutDraftStore");
      saveMockWorkoutDraft({
        workoutId: payload.workoutId,
        session: structuredClone(payload.session),
        status: payload.status,
        templateId: payload.templateId ?? null,
      });
      return { ok: true };
    },
    [],
  );
  const loadWorkoutDraft = useCallback(async (clientId: string) => {
    const { loadMockWorkoutDraftByClientId } = await import("@/lib/mock/mockWorkoutDraftStore");
    const draft = loadMockWorkoutDraftByClientId(clientId);
    if (draft == null) return null;
    const client = clients.find((c) => c.id === clientId);
    const clientName = client?.name ?? draft.session.clientName;
    return {
      workoutId: draft.workoutId,
      session: { ...draft.session, clientName },
      status: draft.status,
      templateId: draft.templateId,
      clientName,
    };
  }, [clients]);
  const discardWorkoutDraft = useCallback(async (workoutId: string): Promise<void> => {
    const { deleteMockWorkoutDraft } = await import("@/lib/mock/mockWorkoutDraftStore");
    deleteMockWorkoutDraft(workoutId);
  }, []);

  const value = useMemo<MockAppContextValue>(
    () => ({
      todayIso: MOCK_TODAY_ISO,
      clients,
      journalEntries,
      scheduleItems,
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
      coachPaymentRecords,
      coachQuickNotes,
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
      mockLifecycle,
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
      clients,
      journalEntries,
      scheduleItems,
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
      coachPaymentRecords,
      coachQuickNotes,
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
      mockLifecycle,
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

  return <MockAppContext.Provider value={value}>{children}</MockAppContext.Provider>;
}

/** Предпочтительный хук данных приложения (mock и live). */
export function useTrainlyApp(): MockAppContextValue {
  const ctx = useContext(MockAppContext);
  if (!ctx) {
    throw new Error("useTrainlyApp должен вызываться внутри MockAppProvider или LiveTrainlyProvider");
  }
  return ctx;
}

/** @deprecated Используйте `useTrainlyApp`. */
export function useMockApp(): MockAppContextValue {
  return useTrainlyApp();
}
