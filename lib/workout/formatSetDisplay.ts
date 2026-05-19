import type { WorkoutSetRow } from "@/lib/workout/types";
import { isFilledSet, parseWorkoutNumber } from "@/lib/workout/calculations";

/** Разделитель подходов в строке «Было» (не точка — чтобы не путать с десятичными). */
export const SET_SUMMARY_SEP = " · ";

const MULT = "×";

function formatWeightKg(raw: string, parsed: number | null): string {
  const t = raw.trim();
  if (t.length === 0) return "";
  if (parsed !== null && parsed > 0) {
    const n = parsed % 1 === 0 ? String(parsed) : String(parsed).replace(".", ",");
    return `${n} кг`;
  }
  return `${t} кг`;
}

function formatReps(raw: string, parsed: number | null): string {
  const t = raw.trim();
  if (t.length === 0) return "";
  if (parsed !== null && parsed > 0) {
    const n = parsed % 1 === 0 ? String(Math.round(parsed)) : String(parsed).replace(".", ",");
    return `${n} повт`;
  }
  return `${t} повт`;
}

/** Одна строка подхода для справки: «110 кг × 10», «45 сек», «12 повт». */
export function formatSetReferenceLabel(row: WorkoutSetRow): string | null {
  const prefix = row.isDrop ? "↳ " : "";

  if (row.setType === "time") {
    const d = parseWorkoutNumber(row.durationSec);
    const t = row.durationSec.trim();
    if (d !== null && d > 0) return `${prefix}${Math.round(d)} сек`;
    if (t.length > 0) return `${prefix}${t} сек`;
    return null;
  }

  const w = parseWorkoutNumber(row.weight);
  const r = parseWorkoutNumber(row.reps);
  const wStr = row.weight.trim();
  const rStr = row.reps.trim();

  if (wStr && rStr) {
    return `${prefix}${formatWeightKg(row.weight, w)} ${MULT} ${formatReps(row.reps, r)}`;
  }
  if (rStr && (w === null || w <= 0)) {
    return `${prefix}${formatReps(row.reps, r)}`;
  }
  if (wStr && !rStr && w !== null && w > 0) {
    return `${prefix}${formatWeightKg(row.weight, w)}`;
  }
  return null;
}

/** Сводка по упражнению для карточки / истории (только заполненные подходы). */
export function formatExerciseSetsReference(exercise: { skipped: boolean; sets: WorkoutSetRow[] }): string {
  if (exercise.skipped) return "";
  const parts: string[] = [];
  for (const row of exercise.sets) {
    if (!isFilledSet(row)) continue;
    const label = formatSetReferenceLabel(row);
    if (label) parts.push(label);
  }
  return parts.join(SET_SUMMARY_SEP);
}

/** Старый формат «110×10» → «110 кг × 10 повт» для отображения. */
export function normalizeLegacySetSummaryPart(part: string): string {
  const t = part.trim();
  const m = t.match(/^(↳\s*)?(\d+(?:[.,]\d+)?)\s*[×x*]\s*(\d+(?:[.,]\d+)?)\s*$/iu);
  if (!m) return t;
  const drop = m[1] ?? "";
  const w = m[2]!.replace(",", ".");
  const r = m[3]!.replace(",", ".");
  return `${drop}${w} кг × ${r} повт`;
}

export function splitSetSummaryParts(summary: string): string[] {
  return summary
    .split(/[·/]/)
    .map((s) => normalizeLegacySetSummaryPart(s.trim()))
    .filter((s) => s.length > 0);
}
