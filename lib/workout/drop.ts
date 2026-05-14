import { createEmptySetRow } from "@/lib/workout/rows";
import type { WorkoutSetRow } from "@/lib/workout/types";

export function resolveDropParent(rows: WorkoutSetRow[]): WorkoutSetRow | null {
  const lastMain = [...rows].reverse().find((r) => !r.isDrop);
  return lastMain ?? rows[rows.length - 1] ?? null;
}

/** MVP: плоская строка с isDrop. Полная вложенность — TODO (WORKOUT_FLOW_SPEC §11). */
export function appendDropRow(rows: WorkoutSetRow[]): WorkoutSetRow[] {
  const parent = resolveDropParent(rows);
  if (!parent) return rows;
  const drop = createEmptySetRow();
  drop.isDrop = true;
  drop.parentSetId = parent.id;
  drop.setType = "drop";
  return [...rows, drop];
}
