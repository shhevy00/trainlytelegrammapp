import type { MockClient, MockScheduleItem } from "@/lib/mock/data";
import type { CoachQuickNote } from "@/lib/mock/coachLedger";
import {
  coachClientSessionsBalanceShortRu,
  resolveCoachPaidSessionsState,
  type CoachPaidSessionsState,
} from "@/lib/coach/paidSessions";
import { formatOverviewHumanDate } from "@/lib/overview/dailyOperations";
import { nextPendingSlotForClient } from "@/lib/clients/clientAttention";

export type ClientBalanceTone = CoachPaidSessionsState;

export interface ClientCardMeta {
  scheduleLine: string;
  isToday: boolean;
  balancePrefix: string;
  balanceNumber: string;
  balanceTitle: string;
  balanceTone: ClientBalanceTone;
  noteLine: string | null;
}

function shortText(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function hasComplaintNote(quickNotes: readonly CoachQuickNote[], clientId: string): boolean {
  return quickNotes.some((n) => n.clientId === clientId && n.type === "complaint" && n.text.trim().length > 0);
}

function balanceParts(remainingSessions: number): { prefix: string; number: string } {
  if (remainingSessions < 0) {
    return { prefix: "Долг", number: String(Math.abs(remainingSessions)) };
  }
  return { prefix: "Осталось", number: String(remainingSessions) };
}

/** Заметка под расписанием — только ограничения и напоминания, не баланс. */
function buildClientCardNoteLine(
  client: MockClient,
  quickNotes: readonly CoachQuickNote[],
): string | null {
  if (client.limitation?.trim()) {
    return `Учесть: ${shortText(client.limitation, 56)}`;
  }
  if (hasComplaintNote(quickNotes, client.id)) return "Есть жалоба в заметках";
  if (client.inactiveDays >= 10) return `Не был ${client.inactiveDays} дн.`;
  return null;
}

export function buildClientCardMeta(
  client: MockClient,
  scheduleItems: readonly MockScheduleItem[],
  todayIso: string,
  quickNotes: readonly CoachQuickNote[],
): ClientCardMeta {
  const nextSlot = nextPendingSlotForClient(scheduleItems, client.id, todayIso);
  const balanceTone = resolveCoachPaidSessionsState(client.remainingSessions);
  const { prefix, number } = balanceParts(client.remainingSessions);

  let scheduleLine: string;
  let isToday = false;
  if (nextSlot) {
    isToday = nextSlot.date === todayIso;
    scheduleLine = isToday
      ? `${nextSlot.time} · ${nextSlot.title}`
      : `${formatOverviewHumanDate(nextSlot.date, todayIso)} · ${nextSlot.time} · ${nextSlot.title}`;
  } else if (client.hasWorkoutToday) {
    isToday = true;
    scheduleLine = "Запись в графике";
  } else {
    scheduleLine = "Нет записи в графике";
  }

  return {
    scheduleLine,
    isToday,
    balancePrefix: prefix,
    balanceNumber: number,
    balanceTitle: coachClientSessionsBalanceShortRu(client.remainingSessions),
    balanceTone,
    noteLine: buildClientCardNoteLine(client, quickNotes),
  };
}

export function clientInitial(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  return t.slice(0, 1).toUpperCase();
}

export function clientsCountLabel(n: number): string {
  if (n === 0) return "Нет клиентов";
  if (n === 1) return "1 клиент";
  if (n >= 2 && n <= 4) return `${n} клиента`;
  return `${n} клиентов`;
}
