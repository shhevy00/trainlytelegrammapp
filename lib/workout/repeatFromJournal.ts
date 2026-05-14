import type { WorkoutExercise, WorkoutSessionState, WorkoutSetRow } from "@/lib/workout/types";
import { newWorkoutId } from "@/lib/workout/ids";
import { createEmptySetRow } from "@/lib/workout/rows";
import { parseWorkoutNumber } from "@/lib/workout/calculations";

/** Строка «Было» из сохранённой тренировки (только справка, не текущие данные). */
export function buildPreviousLineFromSets(sets: WorkoutSetRow[]): string {
  const parts: string[] = [];
  for (const row of sets) {
    const prefix = row.isDrop ? "↳ " : "";
    if (row.setType === "time") {
      const d = parseWorkoutNumber(row.durationSec);
      if (d !== null && d > 0) parts.push(`${prefix}${row.durationSec.trim()} сек`);
      continue;
    }
    const w = row.weight.trim();
    const r = row.reps.trim();
    if (w && r) parts.push(`${prefix}${w}×${r}`);
    else if (r) parts.push(`${prefix}${r} reps`);
  }
  return parts.join(" · ");
}

export function buildReferenceHintsByExerciseName(exercises: WorkoutExercise[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const ex of exercises) {
    const line = buildPreviousLineFromSets(ex.sets).trim();
    if (line.length > 0) map[ex.name] = line;
  }
  return map;
}

function remapDropParents(oldSets: WorkoutSetRow[], newSets: WorkoutSetRow[]): WorkoutSetRow[] {
  const idMap = new Map<string, string>();
  for (let i = 0; i < oldSets.length; i++) {
    idMap.set(oldSets[i].id, newSets[i].id);
  }
  return newSets.map((row, idx) => {
    const orig = oldSets[idx];
    const parentNew = orig.parentSetId ? idMap.get(orig.parentSetId) ?? null : null;
    return { ...row, parentSetId: parentNew };
  });
}

/** Новый черновик: структура и типы строк без весов/повторов/комментариев и без done. */
export function buildRepeatSessionFromSavedWorkout(
  entry: {
    clientId: string;
    clientName: string;
    title: string;
    exercises: WorkoutExercise[];
  },
  opts?: { debtAcknowledged?: boolean },
): WorkoutSessionState {
  const exercises: WorkoutExercise[] = entry.exercises.map((ex) => {
    const oldSets = ex.sets;
    const freshSets = oldSets.map((row) => {
      const blank = createEmptySetRow();
      return {
        ...blank,
        setType: row.setType,
        isDrop: row.isDrop,
        parentSetId: null,
      };
    });
    const sets = remapDropParents(oldSets, freshSets);
    return {
      id: newWorkoutId(),
      name: ex.name,
      comment: "",
      skipped: false,
      sets,
    };
  });

  return {
    clientId: entry.clientId,
    clientName: entry.clientName,
    title: `${entry.title} · повтор`,
    workoutComment: "",
    startedAtMs: Date.now(),
    exercises,
    ...(opts?.debtAcknowledged ? { debtAcknowledged: true } : {}),
  };
}
