import type { MockClient, MockScheduleItem } from "@/lib/mock/data";
import { formatOverviewHumanDate } from "@/lib/overview/dailyOperations";

export type ClientProfileScenario =
  | "workout_today"
  | "inactive"
  | "no_next_workout"
  | "debt"
  | "zero_sessions"
  | "normal";

/** Приоритет как в Stage 6 (сверху вниз). */
export function resolveClientProfileScenario(client: MockClient): ClientProfileScenario {
  if (client.hasWorkoutToday) return "workout_today";
  if (client.inactiveDays >= 10) return "inactive";
  if (!client.hasNextWorkoutScheduled) return "no_next_workout";
  if (client.remainingSessions < 0) return "debt";
  if (client.remainingSessions === 0) return "zero_sessions";
  return "normal";
}

/** Слоты клиента на указанную дату в статусе planned/upcoming. */
export function getPlanSlotsForClientOnDate(
  scheduleItems: MockScheduleItem[],
  clientId: string,
  dateIso: string,
): MockScheduleItem[] {
  return scheduleItems
    .filter(
      (s) =>
        s.clientId === clientId &&
        s.date === dateIso &&
        (s.status === "planned" || s.status === "upcoming"),
    )
    .sort((a, b) => a.time.localeCompare(b.time));
}

/** Ближайшие запланированные слоты начиная с даты (включительно). */
export function getUpcomingSlotsForClientFromDate(
  scheduleItems: MockScheduleItem[],
  clientId: string,
  fromDateIso: string,
): MockScheduleItem[] {
  return scheduleItems
    .filter(
      (s) =>
        s.clientId === clientId &&
        (s.status === "planned" || s.status === "upcoming") &&
        s.date >= fromDateIso,
    )
    .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)));
}

export function formatScheduleSlotLine(slot: MockScheduleItem): string {
  return `${slot.date} · ${slot.time} · ${slot.title} (${slot.durationMinutes} мин)`;
}

/** Человекочитаемая строка слота без ISO (сегодня / завтра / пн 11 мая). */
export function formatScheduleSlotHuman(slot: MockScheduleItem, todayIso: string): string {
  const day = formatOverviewHumanDate(slot.date, todayIso);
  return `${day} ${slot.time} · ${slot.title}`;
}
