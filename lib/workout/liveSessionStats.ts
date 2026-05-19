import {
  computeWorkoutVolumeKg,
  countFilledSetsWorkout,
  countNonSkippedExercises,
  formatSummaryVolumeCell,
} from "@/lib/workout/calculations";
import type { WorkoutExercise } from "@/lib/workout/types";

export interface WorkoutLiveSessionStats {
  volumeLabel: string;
  exerciseCount: number;
  filledSets: number;
  elapsedLabel: string;
}

/** Формат таймера сессии: m:ss */
export function formatWorkoutElapsedMs(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function buildWorkoutLiveSessionStats(
  exercises: WorkoutExercise[],
  elapsedMs: number,
): WorkoutLiveSessionStats {
  const filledSets = countFilledSetsWorkout(exercises);
  const volumeKg = computeWorkoutVolumeKg(exercises);
  return {
    volumeLabel: formatSummaryVolumeCell(volumeKg, filledSets),
    exerciseCount: countNonSkippedExercises(exercises),
    filledSets,
    elapsedLabel: formatWorkoutElapsedMs(elapsedMs),
  };
}

export function clientInitialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter((p) => p.length > 0);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function formatWorkoutStartedAt(ms: number): { dateLabel: string; timeLabel: string } {
  const d = new Date(ms);
  return {
    dateLabel: d.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    timeLabel: d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
  };
}

