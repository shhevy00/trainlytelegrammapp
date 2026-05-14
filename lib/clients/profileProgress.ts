import type { JournalCompletedWorkout, JournalEntry } from "@/lib/types";
import { formatOverviewHumanDate, isoDayLocal, parseLocalDay } from "@/lib/overview/dailyOperations";
import { computeWorkoutVolumeKg, isFilledSet, parseWorkoutNumber } from "@/lib/workout/calculations";
import type { WorkoutExercise } from "@/lib/workout/types";

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;

export type ProfilePeriodKey = "7" | "30" | "90" | "all";

export interface WeekBar {
  key: string;
  label: string;
  count: number;
}

export interface VolumeBar {
  key: string;
  label: string;
  volumeKg: number;
}

export interface ExerciseTrendMini {
  name: string;
  lastLabel: string;
  bestLabel: string;
  normalizedSeries: number[];
}

export interface ProfileProgressDashboard {
  workoutsInPeriod: number;
  workoutsPerWeek: number;
  remainingSessions: number;
  lastWorkoutRelative: string | null;
  lastWorkoutCompletedAtMs: number | null;
  weekBars: WeekBar[];
  volumeBars: VolumeBar[];
  hasVolumeInPeriod: boolean;
  exerciseTrend: ExerciseTrendMini | null;
  /** Графики столбцов — только при достаточном числе завершённых тренировок в периоде. */
  showCharts: boolean;
}

function endOfMockDayMs(dateIso: string): number {
  const d = new Date(`${dateIso}T23:59:59`);
  const t = d.getTime();
  return Number.isFinite(t) ? t : Date.now();
}

function periodStartMs(period: ProfilePeriodKey, refEnd: number): number {
  if (period === "all") return 0;
  const days = period === "7" ? 7 : period === "30" ? 30 : 90;
  return refEnd - days * DAY_MS;
}

function shortRuDay(ms: number): string {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(new Date(ms));
}

function calendarDaysBetweenWorkoutAndToday(workoutMs: number, todayIso: string): number {
  const d1 = isoDayLocal(workoutMs);
  const t1 = parseLocalDay(d1).getTime();
  const t2 = parseLocalDay(todayIso).getTime();
  return Math.round((t2 - t1) / DAY_MS);
}

export function formatLastWorkoutRelative(workoutMs: number, mockTodayIso: string): string {
  const diff = calendarDaysBetweenWorkoutAndToday(workoutMs, mockTodayIso);
  if (diff === 0) return "сегодня";
  if (diff === 1) return "вчера";
  if (diff > 1 && diff <= 14) return `${diff} дн. назад`;
  if (diff < 0) {
    return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" }).format(
      new Date(workoutMs),
    );
  }
  const dayIso = isoDayLocal(workoutMs);
  return formatOverviewHumanDate(dayIso, mockTodayIso);
}

function bestExerciseSetTonnage(ex: WorkoutExercise): number {
  let max = 0;
  for (const row of ex.sets) {
    if (!isFilledSet(row)) continue;
    const w = parseWorkoutNumber(row.weight);
    const r = parseWorkoutNumber(row.reps);
    if (w !== null && r !== null && w > 0 && r > 0) max = Math.max(max, w * r);
  }
  return max;
}

function volumeForWorkout(w: JournalCompletedWorkout): number | null {
  if (w.volumeKg != null && w.volumeKg > 0) return w.volumeKg;
  return computeWorkoutVolumeKg(w.exercises);
}

function normalizeSeries(values: number[]): number[] {
  const m = Math.max(...values, 0);
  if (m <= 0) return values.map(() => 0);
  return values.map((v) => (v > 0 ? v / m : 0));
}

/** Прогресс по периоду: метрики, недели, объём, мини-тренд по упражнению. */
export function computeProfileProgressDashboard(
  clientId: string,
  remainingSessions: number,
  entries: JournalEntry[],
  period: ProfilePeriodKey,
  mockTodayIso: string,
): ProfileProgressDashboard {
  const refEnd = endOfMockDayMs(mockTodayIso);
  const periodStart = periodStartMs(period, refEnd);

  const clientEntries = entries.filter((e) => e.clientId === clientId);
  const workouts = clientEntries.filter((e): e is JournalCompletedWorkout => e.kind === "workout");

  const inPeriod = (w: JournalCompletedWorkout): boolean =>
    w.createdAtMs >= periodStart && w.createdAtMs <= refEnd;

  const workoutsInPeriodList = workouts.filter(inPeriod);
  const workoutsInPeriod = workoutsInPeriodList.length;

  const periodDaysForRate =
    period === "all"
      ? Math.max(
          7,
          (() => {
            let minMs = refEnd;
            for (const w of workouts) {
              if (w.createdAtMs < minMs) minMs = w.createdAtMs;
            }
            const span = Math.max(DAY_MS, refEnd - minMs);
            return Math.ceil(span / DAY_MS);
          })(),
        )
      : period === "7"
        ? 7
        : period === "30"
          ? 30
          : 90;

  const weeksForRate = Math.max(1, periodDaysForRate / 7);
  const workoutsPerWeek = Math.round((workoutsInPeriod / weeksForRate) * 10) / 10;

  let lastMs = 0;
  for (const w of workouts) {
    if (w.createdAtMs > lastMs) lastMs = w.createdAtMs;
  }
  const lastWorkoutCompletedAtMs = lastMs > 0 ? lastMs : null;
  const lastWorkoutRelative =
    lastWorkoutCompletedAtMs != null ? formatLastWorkoutRelative(lastWorkoutCompletedAtMs, mockTodayIso) : null;

  const weekBars: WeekBar[] = [];
  const volumeBars: VolumeBar[] = [];
  const weekCount = 8;
  for (let wi = 0; wi < weekCount; wi++) {
    const weekEnd = refEnd - wi * WEEK_MS;
    const weekStart = weekEnd - WEEK_MS + 1;
    const key = `w${wi}`;
    const label = shortRuDay(weekEnd);
    let count = 0;
    let vol = 0;
    for (const w of workouts) {
      if (w.createdAtMs < weekStart || w.createdAtMs > weekEnd) continue;
      if (!inPeriod(w)) continue;
      count += 1;
      const v = volumeForWorkout(w);
      if (v != null && v > 0) vol += v;
    }
    weekBars.push({ key, label, count });
    volumeBars.push({ key, label, volumeKg: Math.round(vol) });
  }
  weekBars.reverse();
  volumeBars.reverse();

  let hasVolumeInPeriod = false;
  for (const w of workoutsInPeriodList) {
    const v = volumeForWorkout(w);
    if (v != null && v > 0) {
      hasVolumeInPeriod = true;
      break;
    }
  }

  const nameScore = new Map<string, { score: number; displayName: string }>();
  for (const w of workoutsInPeriodList) {
    for (const ex of w.exercises) {
      if (ex.skipped) continue;
      const nm = (ex.name || "").trim();
      if (!nm) continue;
      if (!ex.sets.some((s) => isFilledSet(s))) continue;
      const key = nm.toLowerCase();
      const ton = bestExerciseSetTonnage(ex);
      const prev = nameScore.get(key);
      const bump = ton > 0 ? 2 : 1;
      nameScore.set(key, {
        score: (prev?.score ?? 0) + bump,
        displayName: prev?.displayName ?? nm,
      });
    }
  }

  let bestKey: string | null = null;
  let bestScore = 0;
  for (const [k, v] of nameScore) {
    if (v.score > bestScore) {
      bestScore = v.score;
      bestKey = k;
    }
  }

  let exerciseTrend: ExerciseTrendMini | null = null;
  if (bestKey) {
    const displayName = nameScore.get(bestKey)?.displayName ?? bestKey;
    const seriesWorkouts = [...workoutsInPeriodList]
      .filter((w) => w.exercises.some((ex) => !ex.skipped && (ex.name || "").trim().toLowerCase() === bestKey))
      .sort((a, b) => a.createdAtMs - b.createdAtMs);

    const raw: number[] = seriesWorkouts.map((w) => {
      const ex = w.exercises.find((e) => (e.name || "").trim().toLowerCase() === bestKey);
      if (!ex) return 0;
      return bestExerciseSetTonnage(ex);
    });

    if (raw.length > 0) {
      const best = Math.max(...raw);
      const last = raw[raw.length - 1] ?? 0;
      exerciseTrend = {
        name: displayName,
        lastLabel:
          last > 0
            ? `Последнее: ${last.toLocaleString("ru-RU")} (вес×повторы)`
            : "Последнее: без пары вес×повторы",
        bestLabel: best > 0 ? `Лучший подход: ${best.toLocaleString("ru-RU")}` : "Лучший подход: —",
        normalizedSeries: normalizeSeries(raw),
      };
    }
  }

  const showCharts = workoutsInPeriod >= 3;

  return {
    workoutsInPeriod,
    workoutsPerWeek,
    remainingSessions,
    lastWorkoutRelative,
    lastWorkoutCompletedAtMs,
    weekBars,
    volumeBars,
    hasVolumeInPeriod,
    exerciseTrend,
    showCharts,
  };
}
