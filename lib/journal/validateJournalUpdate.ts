import type { WorkoutExercise } from "@/lib/workout/types";

export interface JournalWorkoutUpdateInput {
  title: string;
  durationMin: number;
  workoutComment: string;
  exercises: WorkoutExercise[];
}

export interface JournalNoteUpdateInput {
  title: string;
  durationMin: number;
  workoutComment: string;
}

export function validateJournalWorkoutUpdate(input: JournalWorkoutUpdateInput): string[] {
  const errors: string[] = [];
  if (input.title.trim().length === 0) {
    errors.push("Укажите название тренировки.");
  }
  if (!Number.isFinite(input.durationMin) || input.durationMin < 1) {
    errors.push("Длительность — от 1 минуты.");
  }
  return errors;
}

export function validateJournalNoteUpdate(input: JournalNoteUpdateInput): string[] {
  const errors: string[] = [];
  if (input.title.trim().length === 0) {
    errors.push("Укажите название.");
  }
  if (!Number.isFinite(input.durationMin) || input.durationMin < 1) {
    errors.push("Длительность — от 1 минуты.");
  }
  return errors;
}
