import type { JournalCompletedWorkout, JournalEntry, JournalNoteEntry } from "@/lib/types";
import { MOCK_TODAY_ISO, mockClients, mockJournalEntries, type MockJournalEntry } from "@/lib/mock/data";

function clientNameOf(clientId: string): string {
  return mockClients.find((c) => c.id === clientId)?.name ?? "Клиент";
}

function parseCreatedMs(dateIso: string, timeHm: string): number {
  const [hh, mm] = timeHm.split(":").map((x) => Number.parseInt(x, 10));
  const d = new Date(`${dateIso}T${Number.isFinite(hh) ? hh : 0}:${Number.isFinite(mm) ? mm : 0}:00`);
  const t = d.getTime();
  return Number.isFinite(t) ? t : Date.now();
}

function legacyWorkoutToJournal(e: MockJournalEntry): JournalCompletedWorkout {
  return {
    kind: "workout",
    id: e.id,
    clientId: e.clientId,
    clientName: clientNameOf(e.clientId),
    createdAtMs: parseCreatedMs(e.date, e.time),
    durationMin: e.durationMin ?? 0,
    status: "completed",
    title: e.title,
    exercises: [],
    workoutComment: "",
    filledSetCount: e.setCount ?? 0,
    volumeKg: e.volumeKg ?? null,
    summaryHint: e.progressHint ?? "",
  };
}

function legacyNoteToJournal(e: MockJournalEntry): JournalNoteEntry {
  return {
    kind: "note",
    id: e.id,
    clientId: e.clientId,
    clientName: clientNameOf(e.clientId),
    createdAtMs: parseCreatedMs(e.date, e.time),
    durationMin: e.durationMin ?? 0,
    status: "completed_as_note",
    title: e.title,
    workoutComment: "",
  };
}

/** Демо: факты тренировок, уже привязанные к завершённым слотам расписания. */
function scheduleLinkedSeedWorkouts(): JournalCompletedWorkout[] {
  return [
    {
      kind: "workout",
      id: "seed-w-s1",
      scheduleItemId: "s1",
      clientId: "c4",
      clientName: clientNameOf("c4"),
      createdAtMs: parseCreatedMs(MOCK_TODAY_ISO, "07:35"),
      durationMin: 45,
      status: "completed",
      title: "Intervals",
      exercises: [],
      workoutComment: "",
      filledSetCount: 0,
      volumeKg: null,
      summaryHint: "По графику",
    },
    {
      kind: "workout",
      id: "seed-w-s2",
      scheduleItemId: "s2",
      clientId: "c2",
      clientName: clientNameOf("c2"),
      createdAtMs: parseCreatedMs(MOCK_TODAY_ISO, "13:15"),
      durationMin: 60,
      status: "completed",
      title: "Back/chest",
      exercises: [],
      workoutComment: "",
      filledSetCount: 0,
      volumeKg: null,
      summaryHint: "По графику",
    },
  ];
}

/** Начальное наполнение журнала из статического mock-списка (без полных упражнений в старых записях). */
export function buildInitialJournalEntries(): JournalEntry[] {
  const legacy = mockJournalEntries.map((e) =>
    e.kind === "note" ? legacyNoteToJournal(e) : legacyWorkoutToJournal(e),
  );
  return [...scheduleLinkedSeedWorkouts(), ...legacy];
}

export function formatJournalDayLabel(ms: number): string {
  return new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(ms));
}

export function formatJournalTime(ms: number): string {
  return new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(new Date(ms));
}
