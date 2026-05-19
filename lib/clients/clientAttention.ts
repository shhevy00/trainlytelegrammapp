import type { MockClient, MockScheduleItem } from "@/lib/mock/data";
import type { CoachQuickNote } from "@/lib/mock/coachLedger";

export const CLIENT_LIST_FILTERS = ["all", "today", "attention", "no_schedule"] as const;

export type ClientListFilter = (typeof CLIENT_LIST_FILTERS)[number];

export function parseClientListFilter(raw: string | string[] | undefined): ClientListFilter {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "today") return "today";
  return "all";
}

export function clientFilterQueryValue(filter: ClientListFilter): string | null {
  if (filter === "all") return null;
  return filter;
}

/** Слоты planned/upcoming для клиента от даты включительно. */
export function nextPendingSlotForClient(
  scheduleItems: readonly MockScheduleItem[],
  clientId: string,
  fromDateIso: string,
): MockScheduleItem | undefined {
  const candidates = scheduleItems.filter(
    (s) =>
      s.clientId === clientId &&
      (s.status === "planned" || s.status === "upcoming") &&
      s.date >= fromDateIso,
  );
  candidates.sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    return d !== 0 ? d : a.time.localeCompare(b.time);
  });
  return candidates[0];
}

export function clientHasScheduleOnDay(
  scheduleItems: readonly MockScheduleItem[],
  clientId: string,
  dateIso: string,
): boolean {
  return scheduleItems.some(
    (s) =>
      s.clientId === clientId &&
      s.date === dateIso &&
      (s.status === "planned" || s.status === "upcoming" || s.status === "completed"),
  );
}

export function clientMatchesTodayFilter(
  client: MockClient,
  scheduleItems: readonly MockScheduleItem[],
  todayIso: string,
): boolean {
  return client.hasWorkoutToday || clientHasScheduleOnDay(scheduleItems, client.id, todayIso);
}

function clientHasAttentionQuickNote(quickNotes: readonly CoachQuickNote[], clientId: string): boolean {
  return quickNotes.some(
    (n) =>
      n.clientId === clientId &&
      (n.type === "complaint" || n.type === "payment") &&
      n.text.trim().length > 0,
  );
}

/** Сегмент «Внимание»: условия из UX-11B (доступные mock-поля и заметки). */
export function clientMatchesAttentionFilter(
  client: MockClient,
  quickNotes: readonly CoachQuickNote[],
): boolean {
  if (client.remainingSessions <= 0) return true;
  if (client.inactiveDays >= 10) return true;
  if (!client.hasNextWorkoutScheduled) return true;
  if (client.limitation?.trim()) return true;
  if (clientHasAttentionQuickNote(quickNotes, client.id)) return true;
  return false;
}

export function clientMatchesNoScheduleFilter(client: MockClient): boolean {
  return !client.hasNextWorkoutScheduled;
}

export function filterClients(
  clients: readonly MockClient[],
  filter: ClientListFilter,
  ctx: { todayIso: string; scheduleItems: readonly MockScheduleItem[]; quickNotes: readonly CoachQuickNote[] },
): MockClient[] {
  const { todayIso, scheduleItems, quickNotes } = ctx;
  switch (filter) {
    case "all":
      return [...clients];
    case "today":
      return clients.filter((c) => clientMatchesTodayFilter(c, scheduleItems, todayIso));
    case "attention":
      return clients.filter((c) => clientMatchesAttentionFilter(c, quickNotes));
    case "no_schedule":
      return clients.filter((c) => clientMatchesNoScheduleFilter(c));
    default:
      return [...clients];
  }
}

export function countAttentionClients(
  clients: readonly MockClient[],
  quickNotes: readonly CoachQuickNote[],
): number {
  return clients.filter((c) => clientMatchesAttentionFilter(c, quickNotes)).length;
}
