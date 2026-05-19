import type { MockScheduleItem } from "@/lib/mock/data";

/** Проведённые слоты остаются в данных для обзора, но не показываются в графике. */
export function isScheduleSlotOnCalendar(item: MockScheduleItem): boolean {
  return item.status !== "completed";
}

export function filterScheduleCalendarItems(items: readonly MockScheduleItem[]): MockScheduleItem[] {
  return items.filter(isScheduleSlotOnCalendar);
}

export function sortScheduleItemsByTime(items: readonly MockScheduleItem[]): MockScheduleItem[] {
  return [...items].sort((a, b) => a.time.localeCompare(b.time));
}

export function scheduleCalendarItemsForDay(allOnDay: readonly MockScheduleItem[]): MockScheduleItem[] {
  return sortScheduleItemsByTime(filterScheduleCalendarItems(allOnDay));
}

export function scheduleCalendarDayHasVisibleEntries(allOnDay: readonly MockScheduleItem[]): boolean {
  return filterScheduleCalendarItems(allOnDay).length > 0;
}

export type ScheduleDayListState =
  | { kind: "empty" }
  | { kind: "all_done" }
  | { kind: "list"; items: MockScheduleItem[] };

export function resolveScheduleDayListState(allOnDay: readonly MockScheduleItem[]): ScheduleDayListState {
  const items = scheduleCalendarItemsForDay(allOnDay);
  if (items.length > 0) return { kind: "list", items };
  const hasCompleted = allOnDay.some((s) => s.status === "completed");
  if (hasCompleted) return { kind: "all_done" };
  return { kind: "empty" };
}

export function schedulePendingRecordsLabel(n: number): string {
  if (n === 0) return "Нет активных записей";
  if (n === 1) return "1 запись";
  if (n >= 2 && n <= 4) return `${n} записи`;
  return `${n} записей`;
}
