import type { MockClient, MockScheduleItem } from "@/lib/mock/data";
import { clientAliasFromName } from "@/lib/ai/ruleFacts";
import type { TodayScheduleRollup } from "@/lib/overview/dailyOperations";
import { todayPendingSlotsSorted } from "@/lib/overview/dailyOperations";

const MAX_REMEMBER_LEN = 118;

/** Короткая первая часть ограничения (до длинного тире). */
export function limitationShort(limitation?: string): string | null {
  if (!limitation?.trim()) return null;
  const t = limitation.trim();
  const dash = /[—–-]\s/;
  const m = dash.exec(t);
  const head = m != null ? t.slice(0, m.index).trim() : t;
  return head.length > 0 ? head : null;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, Math.max(0, max - 1))}…`;
}

/** «2 дня назад · Ноги» → «Ноги 2 дня назад» для компактной строки «прошлая». */
function formatLastWorkoutCompact(last?: string): string | null {
  if (!last?.trim()) return null;
  const segs = last.split("·").map((s) => s.trim());
  if (segs.length >= 2) return `прошлая: ${segs[1]} ${segs[0]}`;
  return `прошлая: ${last.trim()}`;
}

function balanceFragment(remainingSessions: number): string {
  if (remainingSessions < 0) return `Долг ${Math.abs(remainingSessions)}`;
  if (remainingSessions === 0) return "0 занятий";
  return `Осталось ${remainingSessions}`;
}

function templateFragment(nextSlot: MockScheduleItem): string | null {
  const tmpl = nextSlot.templateName?.trim();
  const title = nextSlot.title.trim();
  if (!tmpl || tmpl.toLowerCase() === title.toLowerCase()) return null;
  return `шаблон ${tmpl}`;
}

/**
 * Одна строка «Что учесть» перед ближайшей тренировкой (mock/UI; без мед.формулировок).
 */
export function buildWhatToRememberLine(client: MockClient, nextSlot: MockScheduleItem): string {
  const tmplPart = templateFragment(nextSlot);
  const last = formatLastWorkoutCompact(client.lastWorkoutSummary);
  const lim = limitationShort(client.limitation);

  if (client.completedWorkoutsCount === 0) {
    const parts: string[] = ["Первая тренировка"];
    const g = client.goal?.trim();
    if (g) parts.push(`цель: ${truncate(g, 40)}`);
    else parts.push(balanceFragment(client.remainingSessions));
    if (last) parts.push(last);
    if (tmplPart) parts.push(tmplPart);
    return parts.join(" · ").slice(0, MAX_REMEMBER_LEN);
  }

  const parts: string[] = [];
  if (lim) parts.push(lim);

  if (client.remainingSessions < 0) parts.push(`Долг ${Math.abs(client.remainingSessions)}`);
  else if (client.remainingSessions === 0) parts.push("0 занятий");
  else parts.push(`Осталось ${client.remainingSessions}`);

  if (last) parts.push(last);
  if (tmplPart) parts.push(tmplPart);

  return parts.join(" · ").slice(0, MAX_REMEMBER_LEN);
}

/** Человекочитаемый прогресс за календарный день (по слотам расписания). */
export function formatTodayProgressSentence(rollup: TodayScheduleRollup): string | null {
  if (rollup.totalTrackedSlots === 0) return null;
  return `Сегодня: ${rollup.completedSlots} из ${rollup.totalTrackedSlots} проведено`;
}

/** Крупная цифра + хвост «/ N проведено» для премиум-обзора (без дублирования слова «Сегодня»). */
export function formatTodayProgressSplit(rollup: TodayScheduleRollup): {
  completed: string;
  suffix: string;
} | null {
  if (rollup.totalTrackedSlots === 0) return null;
  return {
    completed: String(rollup.completedSlots),
    suffix: ` / ${rollup.totalTrackedSlots} проведено`,
  };
}

/**
 * Сколько записей на этот день осталось после показанных в «Дальше сегодня» (не считая слот «следующая» в hero).
 */
export function countLaterTodayHidden(
  scheduleItems: MockScheduleItem[],
  dateIso: string,
  nextSlot: MockScheduleItem | undefined,
  shownLaterCount: number,
): number {
  const today = todayPendingSlotsSorted(scheduleItems, dateIso);
  if (!nextSlot) return Math.max(0, today.length - shownLaterCount);
  const idx = today.findIndex((s) => s.id === nextSlot.id);
  const totalAfterNextOnToday = idx >= 0 ? today.length - idx - 1 : today.length;
  return Math.max(0, totalAfterNextOnToday - shownLaterCount);
}

/** Факты для панели «Перед тренировкой» (без генерации; mock). */
export function buildOverviewAiPreparationFacts(
  client: MockClient | undefined,
  nextSlot: MockScheduleItem,
  whatToRemember: string | null,
): string[] {
  const slotLine = `Запись: ${nextSlot.time}, «${nextSlot.title}», ${nextSlot.durationMinutes} мин.`;
  if (!client) return [slotLine];

  const alias = clientAliasFromName(client.name);
  const lines: string[] = [`Клиент: ${alias}.`, slotLine];
  if (whatToRemember?.trim()) lines.push(`Что учесть: ${whatToRemember.trim()}.`);

  if (client.remainingSessions < 0) {
    lines.push(`Долг занятий: ${Math.abs(client.remainingSessions)}.`);
  } else if (client.remainingSessions === 0) {
    lines.push("Оплаченных занятий не осталось.");
  } else {
    lines.push(`Осталось оплаченных занятий: ${client.remainingSessions}.`);
  }

  if (client.lastWorkoutSummary?.trim()) {
    lines.push(`Последняя тренировка (как в профиле): ${client.lastWorkoutSummary.trim()}.`);
  }
  if (client.goal?.trim()) lines.push(`Цель: ${client.goal.trim()}.`);
  if (client.limitation?.trim()) {
    lines.push(`Ограничение (как указано): ${client.limitation.trim()}.`);
  }
  return lines;
}
