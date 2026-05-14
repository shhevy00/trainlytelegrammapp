import type { WorkoutExercise, WorkoutSessionState, WorkoutSetRow } from "@/lib/workout/types";

function serializeSet(row: WorkoutSetRow): Record<string, unknown> {
  return {
    id: row.id,
    setType: row.setType,
    weight: row.weight,
    reps: row.reps,
    durationSec: row.durationSec,
    comment: row.comment,
    done: row.done,
    isDrop: row.isDrop,
    parentSetId: row.parentSetId,
  };
}

function serializeExercise(ex: WorkoutExercise): Record<string, unknown> {
  return {
    id: ex.id,
    name: ex.name,
    comment: ex.comment,
    skipped: ex.skipped,
    sets: ex.sets.map(serializeSet),
  };
}

/** Stable snapshot for dirty detection (meaningful changes only — excludes elapsed timer). */
export function workoutMeaningfulSignature(state: WorkoutSessionState): string {
  const core = {
    title: state.title,
    workoutComment: state.workoutComment,
    exercises: state.exercises.map(serializeExercise),
  };
  return JSON.stringify(core);
}
