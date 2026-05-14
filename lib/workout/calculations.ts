import type { WorkoutExercise, WorkoutSetRow } from "@/lib/workout/types";

/** Parses user-entered numeric fields; empty → null. Accepts comma decimals. */
export function parseWorkoutNumber(raw: string): number | null {
  const s = raw.trim().replace(",", ".");
  if (s === "") return null;
  const n = Number.parseFloat(s);
  if (Number.isNaN(n)) return null;
  return n;
}

/**
 * Filled set rules (WORKOUT_FLOW_SPEC §9).
 * Placeholder-only rows are not filled; set type alone does not fill.
 */
export function isFilledSet(row: WorkoutSetRow): boolean {
  const w = parseWorkoutNumber(row.weight);
  const r = parseWorkoutNumber(row.reps);
  const d = parseWorkoutNumber(row.durationSec);
  const c = row.comment.trim();
  const weightEmpty = row.weight.trim() === "";
  /** Ввод «0» не префиллим, но трактуем как отсутствие веса для правила «повторы без веса». */
  const noEffectiveWeight = weightEmpty || w === 0;

  if (row.done && c.length > 0) {
    return true;
  }

  if (d !== null && d > 0 && w !== null && w > 0) {
    return true;
  }

  if (d !== null && d > 0) {
    return true;
  }

  if (w !== null && w > 0 && r !== null && r > 0) {
    return true;
  }

  if (noEffectiveWeight && r !== null && r > 0) {
    return true;
  }

  return false;
}

export function countFilledSetsInExercise(exercise: WorkoutExercise): number {
  if (exercise.skipped) return 0;
  return exercise.sets.reduce((acc, row) => acc + (isFilledSet(row) ? 1 : 0), 0);
}

export function countFilledSetsWorkout(exercises: WorkoutExercise[]): number {
  return exercises.reduce((acc, ex) => acc + countFilledSetsInExercise(ex), 0);
}

export function countExercisesWithRows(exercises: WorkoutExercise[]): number {
  return exercises.filter((ex) => !ex.skipped && ex.sets.length > 0).length;
}

/** Exercise has zero set rows (not skipped). Used for finish warning. */
export function exerciseHasNoSetRows(exercise: WorkoutExercise): boolean {
  return !exercise.skipped && exercise.sets.length === 0;
}

export function workoutHasExerciseWithNoSetRows(exercises: WorkoutExercise[]): boolean {
  return exercises.some(exerciseHasNoSetRows);
}

/**
 * Volume = sum(weight × reps) for sets with weight>0 and reps>0.
 * Returns null if nothing contributes → UI shows "Volume not calculated" (never fake 0 kg).
 */
export function computeWorkoutVolumeKg(exercises: WorkoutExercise[]): number | null {
  let sum = 0;
  let contributed = false;

  for (const ex of exercises) {
    if (ex.skipped) continue;
    for (const row of ex.sets) {
      const w = parseWorkoutNumber(row.weight);
      const r = parseWorkoutNumber(row.reps);
      if (w !== null && w > 0 && r !== null && r > 0) {
        sum += w * r;
        contributed = true;
      }
    }
  }

  if (!contributed) return null;
  return sum;
}

export function countNonSkippedExercises(exercises: WorkoutExercise[]): number {
  return exercises.filter((ex) => !ex.skipped).length;
}

/** Единая короткая формулировка для UI (журнал, сводки, сообщения клиенту). */
export const WORKOUT_VOLUME_NOT_CALCULATED_RU = "Объём не рассчитан";

/** Фраза для копируемого черновика после тренировки. */
export function formatCompletedWorkoutVolumeSentence(volumeKg: number | null): string {
  if (volumeKg === null) return `${WORKOUT_VOLUME_NOT_CALCULATED_RU}.`;
  return `Объём: ${volumeKg.toLocaleString("ru-RU")} кг.`;
}

/** Ячейка «Объём» на экране итога логгера. */
export function formatSummaryVolumeCell(volumeKg: number | null, filledSets: number): string {
  if (filledSets === 0) return "—";
  if (volumeKg === null) return WORKOUT_VOLUME_NOT_CALCULATED_RU;
  return `${volumeKg.toLocaleString("ru-RU")} кг`;
}

export function mainResultHint(volumeKg: number | null, filledSets: number): string {
  if (filledSets === 0) return "Нет заполненных подходов.";
  if (volumeKg === null) {
    return `${WORKOUT_VOLUME_NOT_CALCULATED_RU} — есть подходы без пары вес×повторы.`;
  }
  return `Суммарный объём по вес×повторы: ${volumeKg.toLocaleString("ru-RU")} кг.`;
}

/** Есть ли в строке данные, из‑за которых стоит спросить подтверждение перед удалением. */
export function setRowHasMeaningfulData(row: WorkoutSetRow): boolean {
  if (isFilledSet(row) || row.done) return true;
  if (row.weight.trim().length > 0) return true;
  if (row.reps.trim().length > 0) return true;
  if (row.durationSec.trim().length > 0) return true;
  if (row.comment.trim().length > 0) return true;
  return false;
}
