import type { WorkoutExercise } from "@/lib/workout/types";

/** Запись журнала: полная тренировка (mock, до появления БД). */
export interface JournalCompletedWorkout {
  kind: "workout";
  id: string;
  clientId: string;
  clientName: string;
  /** Связь с планом расписания (mock); факт тренировки дополняет слот. */
  scheduleItemId?: string;
  /** Метка времени завершения (локальные mock-данные). */
  createdAtMs: number;
  durationMin: number;
  status: "completed";
  title: string;
  exercises: WorkoutExercise[];
  workoutComment: string;
  filledSetCount: number;
  volumeKg: number | null;
  summaryHint: string;
}

/** Контакт / сессия без полноценного логирования подходов. */
export interface JournalNoteEntry {
  kind: "note";
  id: string;
  clientId: string;
  clientName: string;
  /** Если заметка создана из контекста слота — слот не переводится в completed (Stage 5). */
  scheduleItemId?: string;
  createdAtMs: number;
  durationMin: number;
  status: "completed_as_note";
  title: string;
  workoutComment: string;
}

export type JournalEntry = JournalCompletedWorkout | JournalNoteEntry;
