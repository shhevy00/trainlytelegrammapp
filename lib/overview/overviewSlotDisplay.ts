import type { MockScheduleItem } from "@/lib/mock/data";

function workoutLabel(slot: MockScheduleItem): string {
  const tmpl = slot.templateName?.trim();
  const title = slot.title.trim();
  if (tmpl && tmpl.length > 0 && !/^\d+$/.test(tmpl)) return tmpl;
  if (title.length > 0) return title;
  return "Занятие";
}

/** Подзаголовок hero: «Core · 45 мин» (как в макете). */
export function nextSessionSubtitle(slot: MockScheduleItem): string {
  return `${workoutLabel(slot)} · ${slot.durationMinutes} мин`;
}

export function slotRowSecondLine(slot: MockScheduleItem): string {
  return nextSessionSubtitle(slot);
}
