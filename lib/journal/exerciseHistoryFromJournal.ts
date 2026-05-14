import type { JournalEntry, JournalCompletedWorkout } from "@/lib/types";
import type { ExerciseHistoryDemo } from "@/lib/mock/workoutDemo";
import type { WorkoutExercise, WorkoutSetRow } from "@/lib/workout/types";
import { isoDayLocal } from "@/lib/overview/dailyOperations";
import { isFilledSet, parseWorkoutNumber } from "@/lib/workout/calculations";

function normalizeExerciseName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function formatHistoryDayLabel(createdAtMs: number, todayIso: string): string {
  const dayIso = isoDayLocal(createdAtMs);
  if (dayIso === todayIso) return "сегодня";
  return new Date(createdAtMs).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function formatExerciseLine(ex: WorkoutExercise): string {
  const parts: string[] = [];
  for (const row of ex.sets) {
    if (!isFilledSet(row)) continue;
    const w = parseWorkoutNumber(row.weight);
    const r = parseWorkoutNumber(row.reps);
    const d = parseWorkoutNumber(row.durationSec);
    if (w !== null && w > 0 && r !== null && r > 0) {
      parts.push(`${w}×${r}`);
    } else if (d !== null && d > 0) {
      parts.push(`${d} с`);
    }
  }
  return parts.length > 0 ? parts.join(" / ") : "—";
}

function setTonnage(row: WorkoutSetRow): number | null {
  const w = parseWorkoutNumber(row.weight);
  const r = parseWorkoutNumber(row.reps);
  if (w === null || w <= 0 || r === null || r <= 0) return null;
  return w * r;
}

function insertPairsFromExercise(ex: WorkoutExercise): { weight: string; reps: string }[] {
  const out: { weight: string; reps: string }[] = [];
  for (const row of ex.sets) {
    if (!isFilledSet(row)) continue;
    const w = row.weight.trim();
    const r = row.reps.trim();
    if (w && r) out.push({ weight: w, reps: r });
  }
  return out;
}

/**
 * История упражнения по журналу: совпадение clientId + нормализованное имя упражнения.
 */
export function buildExerciseHistoryFromJournal(
  entries: readonly JournalEntry[],
  clientId: string,
  exerciseName: string,
  todayIso: string,
): ExerciseHistoryDemo | null {
  const key = normalizeExerciseName(exerciseName);
  if (!key) return null;

  const workouts: JournalCompletedWorkout[] = entries
    .filter((e): e is JournalCompletedWorkout => e.kind === "workout" && e.clientId === clientId && e.exercises.length > 0)
    .sort((a, b) => b.createdAtMs - a.createdAtMs);

  const matches: { entry: JournalCompletedWorkout; exercise: WorkoutExercise }[] = [];
  for (const entry of workouts) {
    const ex = entry.exercises.find((x) => !x.skipped && normalizeExerciseName(x.name) === key);
    if (ex) matches.push({ entry, exercise: ex });
  }

  if (matches.length === 0) return null;

  const [latest] = matches;
  const previousSummary = formatExerciseLine(latest.exercise);
  const insertTemplate = insertPairsFromExercise(latest.exercise);

  let bestTonnage = 0;
  let bestLabel: string | null = null;
  for (const { exercise } of matches) {
    for (const row of exercise.sets) {
      const t = setTonnage(row);
      if (t !== null && t > bestTonnage) {
        bestTonnage = t;
        const w = parseWorkoutNumber(row.weight);
        const r = parseWorkoutNumber(row.reps);
        if (w !== null && r !== null) bestLabel = `${w}×${r}`;
      }
    }
  }
  const bestSummary = bestLabel;

  const lastThree = matches.slice(0, 3).map(({ entry, exercise }) => ({
    date: formatHistoryDayLabel(entry.createdAtMs, todayIso),
    text: formatExerciseLine(exercise),
  }));

  const lastComment = latest.exercise.comment.trim() || null;

  return {
    previousSummary,
    bestSummary,
    lastThree,
    lastComment,
    insertTemplate,
  };
}
