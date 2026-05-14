import { newWorkoutId } from "@/lib/workout/ids";
import type { WorkoutSetRow } from "@/lib/workout/types";

export function createEmptySetRow(): WorkoutSetRow {
  return {
    id: newWorkoutId(),
    setType: "working",
    weight: "",
    reps: "",
    durationSec: "",
    comment: "",
    done: false,
    isDrop: false,
    parentSetId: null,
  };
}
