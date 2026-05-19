import {
  computeWorkoutVolumeKg,
  countFilledSetsWorkout,
  countNonSkippedExercises,
  mainResultHint,
} from "@/lib/workout/calculations";
import type { WorkoutExercise } from "@/lib/workout/types";

export function recomputeJournalWorkoutStats(exercises: WorkoutExercise[]): {
  filledSetCount: number;
  volumeKg: number | null;
  summaryHint: string;
} {
  const filledSetCount = countFilledSetsWorkout(exercises);
  const volumeKg = computeWorkoutVolumeKg(exercises);
  const summaryHint = mainResultHint(volumeKg, filledSetCount);
  return { filledSetCount, volumeKg, summaryHint };
}

export function countJournalWorkoutExercises(exercises: WorkoutExercise[]): number {
  return countNonSkippedExercises(exercises);
}
