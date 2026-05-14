import type { WorkoutExercise } from "@/lib/workout/types";
import { createEmptySetRow } from "@/lib/workout/rows";

export interface WeightRepsPair {
  weight: string;
  reps: string;
}

/** Заполняет пустые строки по порядку, затем добавляет новые. Никогда не вызывается автоматически. */
export function insertPreviousValues(
  exercise: WorkoutExercise,
  template: WeightRepsPair[],
): WorkoutExercise {
  const rows = exercise.sets.map((r) => ({ ...r }));
  let ti = 0;

  for (let i = 0; i < rows.length && ti < template.length; i++) {
    const emptySlot =
      rows[i].weight.trim() === "" &&
      rows[i].reps.trim() === "" &&
      rows[i].durationSec.trim() === "" &&
      rows[i].comment.trim() === "" &&
      !rows[i].done;
    if (emptySlot) {
      rows[i] = {
        ...rows[i],
        weight: template[ti].weight,
        reps: template[ti].reps,
      };
      ti++;
    }
  }

  while (ti < template.length) {
    const row = createEmptySetRow();
    row.weight = template[ti].weight;
    row.reps = template[ti].reps;
    rows.push(row);
    ti++;
  }

  return { ...exercise, sets: rows };
}
