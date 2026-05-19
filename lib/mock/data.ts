/**
 * Mock-only demo data for UI scaffolding. Not persisted; replace with API/DB later.
 */

export const MOCK_TODAY_ISO = "2026-05-11";

/** Сколько слотов в блоке «Дальше сегодня» на обзоре (после ближайшей записи в этот же день). Компактно для одного экрана. */
export const MOCK_OVERVIEW_LATER_TODAY_LIMIT = 2;

export interface MockTrainer {
  firstName: string;
}

export interface MockClient {
  id: string;
  name: string;
  goal?: string;
  remainingSessions: number;
  limitation?: string;
  lastWorkoutSummary?: string;
  inactiveDays: number;
  hasWorkoutToday: boolean;
  hasNextWorkoutScheduled: boolean;
  completedWorkoutsCount: number;
  /** Демо-память тренера об оплате; не связано с биллингом Trainly. */
  lastPaymentSummary?: string;
  paymentHistoryMock?: readonly { dateIso: string; label: string }[];
}

export type MockScheduleStatus =
  | "planned"
  | "upcoming"
  | "completed"
  | "missed"
  | "cancelled";

/** Плановый слот (mock). Факт тренировки — отдельная сущность в журнале. */
export interface MockScheduleItem {
  id: string;
  clientId: string;
  clientName: string;
  date: string;
  time: string;
  durationMinutes: number;
  title: string;
  status: MockScheduleStatus;
  /** id записи журнала `kind: workout`, если слот закрыт полной тренировкой */
  workoutId?: string;
  /** Опциональная привязка к шаблону тренировки клиента (mock). */
  templateId?: string;
  /** Подпись для UI; может устареть при переименовании шаблона. */
  templateName?: string;
}

export type MockJournalKind = "workout" | "note";

export interface MockJournalEntry {
  id: string;
  date: string;
  time: string;
  clientId: string;
  title: string;
  durationMin?: number;
  exerciseCount?: number;
  setCount?: number;
  volumeKg?: number;
  progressHint?: string;
  kind: MockJournalKind;
}

export const mockTrainer: MockTrainer = {
  firstName: "Alexander",
};

export const mockClients: MockClient[] = [
  {
    id: "c1",
    name: "Anna Sokolova",
    goal: "Похудение −8 кг",
    remainingSessions: 2,
    limitation: "Колено — без агрессивных выпадов",
    lastWorkoutSummary: "2 дня назад · Ноги",
    inactiveDays: 2,
    hasWorkoutToday: true,
    hasNextWorkoutScheduled: true,
    completedWorkoutsCount: 12,
    lastPaymentSummary: "10 апр. 2026 · пакет 10 занятий",
    paymentHistoryMock: [
      { dateIso: "2026-04-10", label: "Пакет 10 занятий · оплачено" },
      { dateIso: "2026-02-01", label: "Пакет 10 занятий · оплачено" },
    ],
  },
  {
    id: "c2",
    name: "Mikhail Orlov",
    goal: "Сила",
    remainingSessions: 0,
    lastWorkoutSummary: "4 дня назад · Верх",
    inactiveDays: 4,
    hasWorkoutToday: false,
    hasNextWorkoutScheduled: true,
    completedWorkoutsCount: 9,
    lastPaymentSummary: "Оплаченные занятия закончились",
    paymentHistoryMock: [{ dateIso: "2026-03-01", label: "Пакет 8 занятий · оплачено" }],
  },
  {
    id: "c3",
    name: "Elena Pak",
    goal: "Мобильность",
    remainingSessions: 4,
    lastWorkoutSummary: "Вчера · заметка",
    inactiveDays: 1,
    hasWorkoutToday: true,
    hasNextWorkoutScheduled: true,
    completedWorkoutsCount: 6,
    lastPaymentSummary: "15 мар. 2026 · продление пакета",
    paymentHistoryMock: [{ dateIso: "2026-03-15", label: "Пакет 6 занятий · оплачено" }],
  },
  {
    id: "c4",
    name: "Dmitry Lesin",
    goal: "Выносливость",
    remainingSessions: 8,
    inactiveDays: 0,
    hasWorkoutToday: false,
    hasNextWorkoutScheduled: true,
    completedWorkoutsCount: 0,
  },
  {
    id: "c5",
    name: "Olga Kim",
    goal: "Спина",
    limitation: "Спина — без рывков",
    remainingSessions: 4,
    lastWorkoutSummary: "18 дней назад · Спина",
    inactiveDays: 18,
    hasWorkoutToday: false,
    hasNextWorkoutScheduled: true,
    completedWorkoutsCount: 14,
  },
  {
    id: "c6",
    name: "Ivan Petrov",
    goal: "Пресс",
    remainingSessions: 3,
    inactiveDays: 3,
    hasWorkoutToday: true,
    hasNextWorkoutScheduled: true,
    completedWorkoutsCount: 4,
  },
  {
    id: "c7",
    name: "Sofia Volkova",
    goal: "ОФП",
    remainingSessions: 6,
    inactiveDays: 0,
    hasWorkoutToday: true,
    hasNextWorkoutScheduled: true,
    completedWorkoutsCount: 8,
  },
  {
    id: "c8",
    name: "Alex Martynov",
    goal: "Сила",
    remainingSessions: 1,
    inactiveDays: 1,
    hasWorkoutToday: true,
    hasNextWorkoutScheduled: true,
    completedWorkoutsCount: 20,
  },
  {
    id: "c9",
    name: "Kate Smirnova",
    goal: "Похудение",
    remainingSessions: 5,
    inactiveDays: 5,
    hasWorkoutToday: false,
    hasNextWorkoutScheduled: true,
    completedWorkoutsCount: 3,
  },
  {
    id: "c10",
    name: "Roman Stepanov",
    goal: "Кор",
    remainingSessions: 0,
    inactiveDays: 0,
    hasWorkoutToday: true,
    hasNextWorkoutScheduled: true,
    completedWorkoutsCount: 11,
  },
  {
    id: "c11",
    name: "Julia Fedorova",
    goal: "Реаб после колена",
    limitation: "Без прыжков",
    remainingSessions: 8,
    inactiveDays: 2,
    hasWorkoutToday: true,
    hasNextWorkoutScheduled: true,
    completedWorkoutsCount: 7,
  },
  {
    id: "c12",
    name: "Sergey Nikitin",
    goal: "Гипертрофия",
    remainingSessions: 4,
    inactiveDays: 4,
    hasWorkoutToday: false,
    hasNextWorkoutScheduled: true,
    completedWorkoutsCount: 15,
  },
  {
    id: "c13",
    name: "Maria Bogdanova",
    goal: "Осанка",
    remainingSessions: 2,
    inactiveDays: 0,
    hasWorkoutToday: true,
    hasNextWorkoutScheduled: true,
    completedWorkoutsCount: 5,
  },
  {
    id: "c14",
    name: "Pavel Chernov",
    goal: "Жим",
    remainingSessions: 10,
    inactiveDays: 1,
    hasWorkoutToday: true,
    hasNextWorkoutScheduled: true,
    completedWorkoutsCount: 22,
  },
  {
    id: "c15",
    name: "Irina Savina",
    goal: "Кардио",
    remainingSessions: 3,
    inactiveDays: 6,
    hasWorkoutToday: false,
    hasNextWorkoutScheduled: true,
    completedWorkoutsCount: 9,
  },
];

/** Начальное расписание; живое состояние — в MockAppProvider. */
export const INITIAL_SCHEDULE_ITEMS: MockScheduleItem[] = [
  {
    id: "s1",
    clientId: "c4",
    clientName: "Dmitry Lesin",
    date: MOCK_TODAY_ISO,
    time: "07:00",
    durationMinutes: 45,
    title: "Intervals",
    status: "completed",
    workoutId: "seed-w-s1",
  },
  {
    id: "s2",
    clientId: "c2",
    clientName: "Mikhail Orlov",
    date: MOCK_TODAY_ISO,
    time: "12:30",
    durationMinutes: 60,
    title: "Back/chest",
    status: "completed",
    workoutId: "seed-w-s2",
  },
  {
    id: "s3",
    clientId: "c1",
    clientName: "Anna Sokolova",
    date: MOCK_TODAY_ISO,
    time: "18:00",
    durationMinutes: 60,
    title: "Legs",
    status: "upcoming",
    templateId: "wt-seed-c1-legs",
    templateName: "Ноги",
  },
  {
    id: "s4",
    clientId: "c3",
    clientName: "Elena Pak",
    date: MOCK_TODAY_ISO,
    time: "20:00",
    durationMinutes: 40,
    title: "Mobility",
    status: "planned",
  },
  {
    id: "s5",
    clientId: "c6",
    clientName: "Ivan Petrov",
    date: MOCK_TODAY_ISO,
    time: "08:00",
    durationMinutes: 45,
    title: "Core",
    status: "planned",
  },
  {
    id: "s6",
    clientId: "c7",
    clientName: "Sofia Volkova",
    date: MOCK_TODAY_ISO,
    time: "09:00",
    durationMinutes: 50,
    title: "ОФП",
    status: "upcoming",
  },
  {
    id: "s7",
    clientId: "c8",
    clientName: "Alex Martynov",
    date: MOCK_TODAY_ISO,
    time: "10:00",
    durationMinutes: 60,
    title: "Push",
    status: "planned",
  },
  {
    id: "s8",
    clientId: "c9",
    clientName: "Kate Smirnova",
    date: MOCK_TODAY_ISO,
    time: "11:00",
    durationMinutes: 45,
    title: "Full body",
    status: "planned",
  },
  {
    id: "s9",
    clientId: "c10",
    clientName: "Roman Stepanov",
    date: MOCK_TODAY_ISO,
    time: "13:00",
    durationMinutes: 60,
    title: "Кор + стабилизация",
    status: "upcoming",
  },
  {
    id: "s10",
    clientId: "c11",
    clientName: "Julia Fedorova",
    date: MOCK_TODAY_ISO,
    time: "14:00",
    durationMinutes: 50,
    title: "Ноги лёгкие",
    status: "planned",
  },
  {
    id: "s11",
    clientId: "c12",
    clientName: "Sergey Nikitin",
    date: MOCK_TODAY_ISO,
    time: "15:00",
    durationMinutes: 75,
    title: "Спина/бицепс",
    status: "planned",
  },
  {
    id: "s12",
    clientId: "c13",
    clientName: "Maria Bogdanova",
    date: MOCK_TODAY_ISO,
    time: "16:00",
    durationMinutes: 40,
    title: "Осанка",
    status: "upcoming",
  },
  {
    id: "s13",
    clientId: "c14",
    clientName: "Pavel Chernov",
    date: MOCK_TODAY_ISO,
    time: "17:00",
    durationMinutes: 60,
    title: "Жимовой",
    status: "planned",
  },
  {
    id: "s14",
    clientId: "c15",
    clientName: "Irina Savina",
    date: MOCK_TODAY_ISO,
    time: "17:30",
    durationMinutes: 45,
    title: "Интервалы",
    status: "planned",
  },
];

export const mockJournalEntries: MockJournalEntry[] = [
  {
    id: "j1",
    date: MOCK_TODAY_ISO,
    time: "18:00",
    clientId: "c1",
    title: "Legs",
    durationMin: 52,
    exerciseCount: 4,
    setCount: 12,
    volumeKg: 8420,
    progressHint: "Leg press +2.5 kg",
    kind: "workout",
  },
  {
    id: "j2",
    date: MOCK_TODAY_ISO,
    time: "16:00",
    clientId: "c3",
    title: "Mobility",
    kind: "note",
  },
  {
    id: "j3",
    date: "2026-05-09",
    time: "10:15",
    clientId: "c2",
    title: "Upper",
    durationMin: 55,
    exerciseCount: 5,
    setCount: 15,
    volumeKg: 6120,
    kind: "workout",
  },
];

export function getClientById(clientId: string): MockClient | undefined {
  return mockClients.find((c) => c.id === clientId);
}
