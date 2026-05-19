import { newWorkoutId } from "@/lib/workout/ids";
import type { WorkoutLoggerBootstrap } from "@/lib/workout/templates";

/** Стабильный id строки `workouts` для autosave (resume или новая сессия). */
export function resolvePersistedWorkoutId(bootstrap: WorkoutLoggerBootstrap): string {
  return bootstrap.persistedWorkoutId ?? newWorkoutId();
}
