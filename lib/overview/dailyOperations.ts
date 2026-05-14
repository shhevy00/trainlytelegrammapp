import type { JournalCompletedWorkout, JournalEntry } from "@/lib/types";
import type { MockClient, MockScheduleItem } from "@/lib/mock/data";
import type { CoachQuickNote } from "@/lib/mock/coachLedger";

const RU_WEEKDAY_SHORT = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"] as const;
const RU_MONTH_SHORT = [
  "янв",
  "фев",
  "мар",
  "апр",
  "мая",
  "июн",
  "июл",
  "авг",
  "сен",
  "окт",
  "ноя",
  "дек",
] as const;

export function parseLocalDay(dateIso: string): Date {
  const [y, m, d] = dateIso.split("-").map((x) => Number(x));
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDaysLocal(dateIso: string, days: number): string {
  const d = parseLocalDay(dateIso);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

/** Короткая подпись даты для обзора: сегодня, завтра, пн 11 мая (без ISO). */
export function formatOverviewHumanDate(dateIso: string, todayIso: string): string {
  if (dateIso === todayIso) return "сегодня";
  if (dateIso === addDaysLocal(todayIso, 1)) return "завтра";
  const d = parseLocalDay(dateIso);
  const wd = RU_WEEKDAY_SHORT[d.getDay()] ?? "пн";
  const mon = RU_MONTH_SHORT[d.getMonth()] ?? "янв";
  return `${wd} ${d.getDate()} ${mon}`;
}

/** Локальный календарный день для mock-сравнений с MOCK_TODAY_ISO. */
export function isoDayLocal(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const ACTIVE_SCHEDULE: MockScheduleItem["status"][] = ["planned", "upcoming", "completed"];

export interface TodayScheduleRollup {
  /** Завершённые слоты на эту дату по расписанию. */
  completedSlots: number;
  /** Запланированные / предстоящие слоты на эту дату. */
  pendingSlots: number;
  /** Все учитываемые слоты на дату (без missed/cancelled). */
  totalTrackedSlots: number;
}

export function rollupScheduleForDay(scheduleItems: MockScheduleItem[], dateIso: string): TodayScheduleRollup {
  const todayRows = scheduleItems.filter((s) => s.date === dateIso && ACTIVE_SCHEDULE.includes(s.status));
  const completedSlots = todayRows.filter((s) => s.status === "completed").length;
  const pendingSlots = todayRows.filter((s) => s.status === "planned" || s.status === "upcoming").length;
  return {
    completedSlots,
    pendingSlots,
    totalTrackedSlots: completedSlots + pendingSlots,
  };
}

export function countJournalWorkoutsOnDay(entries: JournalEntry[], dateIso: string): number {
  return entries.filter(
    (e): e is JournalCompletedWorkout =>
      e.kind === "workout" && isoDayLocal(e.createdAtMs) === dateIso,
  ).length;
}

function compareSlots(a: MockScheduleItem, b: MockScheduleItem): number {
  const dc = a.date.localeCompare(b.date);
  if (dc !== 0) return dc;
  return a.time.localeCompare(b.time);
}

/** Ближайшие запланированные слоты (от указанной даты включительно), по дате и времени. */
export function upcomingPendingSlots(
  scheduleItems: MockScheduleItem[],
  fromDateIso: string,
  limit: number,
): MockScheduleItem[] {
  const candidates = scheduleItems.filter(
    (s) => (s.status === "planned" || s.status === "upcoming") && s.date >= fromDateIso,
  );
  candidates.sort(compareSlots);
  return candidates.slice(0, Math.max(0, limit));
}

/** Ближайший слот planned/upcoming начиная с указанной даты (включительно). */
export function nextPendingScheduleSlot(
  scheduleItems: MockScheduleItem[],
  fromDateIso: string,
): MockScheduleItem | undefined {
  const candidates = scheduleItems.filter(
    (s) => (s.status === "planned" || s.status === "upcoming") && s.date >= fromDateIso,
  );
  candidates.sort(compareSlots);
  return candidates[0];
}

export function todayPendingSlotsSorted(scheduleItems: MockScheduleItem[], dateIso: string): MockScheduleItem[] {
  return scheduleItems
    .filter(
      (s) =>
        s.date === dateIso && (s.status === "planned" || s.status === "upcoming"),
    )
    .sort((a, b) => a.time.localeCompare(b.time));
}

export type AttentionSeverity = "critical" | "warn" | "info";

/** Меньше = выше в блоке «Что важно» (соответствует приоритетам продукта). */
export const ATTENTION_PRIORITY_DEBT = 1;
export const ATTENTION_PRIORITY_ZERO = 2;
export const ATTENTION_PRIORITY_LIMIT_TODAY = 3;
export const ATTENTION_PRIORITY_INACTIVE = 4;
export const ATTENTION_PRIORITY_NO_NEXT = 5;
export const ATTENTION_PRIORITY_ONE_LEFT = 6;
export const ATTENTION_PRIORITY_PAYMENT_NOTE = 7;
export const ATTENTION_PRIORITY_FIRST_WORKOUT = 8;

export interface OverviewAttentionItem {
  id: string;
  severity: AttentionSeverity;
  /** Имя клиента (первая строка карточки). */
  title: string;
  /** Короткая вторая строка. */
  reason: string;
  actionLabel: string;
  attentionPriority: number;
  /** Если есть — клиентская навигация без доп. обработки */
  href?: string;
  disabled?: boolean;
  clientId?: string;
}

/** Строка «Важное» для активного черновика (на обзоре черновик вынесен в hero; функция оставлена для тестов/совместимости). */
export function overviewDraftAttentionItem(): OverviewAttentionItem {
  return {
    id: "draft-workout",
    severity: "warn",
    title: "Черновик",
    reason: "Не завершена тренировка в логгере.",
    actionLabel: "Продолжить",
    attentionPriority: 0,
  };
}

function journalWorkoutCountForClient(entries: JournalEntry[], clientId: string): number {
  return entries.filter((e) => e.kind === "workout" && e.clientId === clientId).length;
}

function shortLimitationLabel(limitation: string, maxLen: number): string {
  const t = limitation.trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, Math.max(0, maxLen - 1))}…`;
}

/** Одно правило на клиента с минимальным `attentionPriority` (самое срочное). */
export function buildOverviewAttentionItems(
  clients: MockClient[],
  journalEntries: JournalEntry[],
  coachQuickNotes: CoachQuickNote[] = [],
): OverviewAttentionItem[] {
  const items: OverviewAttentionItem[] = [];

  type Cand = { pri: number; item: OverviewAttentionItem };
  const byClient = new Map<string, Cand>();

  const pushClient = (clientId: string, cand: Cand): void => {
    const prev = byClient.get(clientId);
    if (!prev || cand.pri < prev.pri) byClient.set(clientId, cand);
  };

  for (const c of clients) {
    const jw = journalWorkoutCountForClient(journalEntries, c.id);

    if (c.remainingSessions < 0) {
      pushClient(c.id, {
        pri: ATTENTION_PRIORITY_DEBT,
        item: {
          id: `${c.id}-debt`,
          severity: "critical",
          title: c.name,
          reason: `Долг: ${Math.abs(c.remainingSessions)} занятий`,
          actionLabel: "Оплата",
          attentionPriority: ATTENTION_PRIORITY_DEBT,
          href: `/add-payment?clientId=${encodeURIComponent(c.id)}`,
          clientId: c.id,
        },
      });
    } else if (c.remainingSessions === 0) {
      pushClient(c.id, {
        pri: ATTENTION_PRIORITY_ZERO,
        item: {
          id: `${c.id}-zero`,
          severity: "critical",
          title: c.name,
          reason: "Осталось занятий: 0",
          actionLabel: "Оплата",
          attentionPriority: ATTENTION_PRIORITY_ZERO,
          href: `/add-payment?clientId=${encodeURIComponent(c.id)}`,
          clientId: c.id,
        },
      });
    } else if (c.limitation && c.hasWorkoutToday) {
      pushClient(c.id, {
        pri: ATTENTION_PRIORITY_LIMIT_TODAY,
        item: {
          id: `${c.id}-limit-today`,
          severity: "info",
          title: c.name,
          reason: `Сегодня: ${shortLimitationLabel(c.limitation, 48)}`,
          actionLabel: "Открыть",
          attentionPriority: ATTENTION_PRIORITY_LIMIT_TODAY,
          href: `/clients/${encodeURIComponent(c.id)}`,
          clientId: c.id,
        },
      });
    } else if (c.inactiveDays >= 10) {
      pushClient(c.id, {
        pri: ATTENTION_PRIORITY_INACTIVE,
        item: {
          id: `${c.id}-inactive`,
          severity: "warn",
          title: c.name,
          reason: `${c.inactiveDays} дн. без тренировок`,
          actionLabel: "Написать",
          attentionPriority: ATTENTION_PRIORITY_INACTIVE,
          href: `/clients/${encodeURIComponent(c.id)}`,
          clientId: c.id,
        },
      });
    } else if (!c.hasNextWorkoutScheduled) {
      pushClient(c.id, {
        pri: ATTENTION_PRIORITY_NO_NEXT,
        item: {
          id: `${c.id}-no-next`,
          severity: "warn",
          title: c.name,
          reason: "Нет следующей записи в графике",
          actionLabel: "График",
          attentionPriority: ATTENTION_PRIORITY_NO_NEXT,
          href: "/schedule",
          clientId: c.id,
        },
      });
    } else if (c.remainingSessions === 1) {
      pushClient(c.id, {
        pri: ATTENTION_PRIORITY_ONE_LEFT,
        item: {
          id: `${c.id}-one-left`,
          severity: "warn",
          title: c.name,
          reason: "Осталось 1 занятие",
          actionLabel: "Оплата",
          attentionPriority: ATTENTION_PRIORITY_ONE_LEFT,
          href: `/add-payment?clientId=${encodeURIComponent(c.id)}`,
          clientId: c.id,
        },
      });
    }

    if (c.completedWorkoutsCount === 0 && jw === 0) {
      pushClient(c.id, {
        pri: ATTENTION_PRIORITY_FIRST_WORKOUT,
        item: {
          id: `${c.id}-first`,
          severity: "info",
          title: c.name,
          reason: "Ещё не было тренировок",
          actionLabel: "Начать",
          attentionPriority: ATTENTION_PRIORITY_FIRST_WORKOUT,
          href: `/start-workout?clientId=${encodeURIComponent(c.id)}`,
          clientId: c.id,
        },
      });
    }
  }

  for (const { item } of byClient.values()) {
    items.push(item);
  }

  const clientIdsFromRules = new Set(byClient.keys());
  const paymentNotesSeen = new Set<string>();
  for (const n of coachQuickNotes) {
    if (n.type !== "payment") continue;
    const t = n.text.trim();
    if (!t) continue;
    if (paymentNotesSeen.has(n.clientId)) continue;
    paymentNotesSeen.add(n.clientId);
    if (clientIdsFromRules.has(n.clientId)) continue;
    const clientName = clients.find((c) => c.id === n.clientId)?.name ?? n.clientName;
    const shortNote = t.length > 72 ? `${t.slice(0, 69)}…` : t;
    items.push({
      id: `${n.clientId}-coach-payment-note`,
      severity: "info",
      title: clientName,
      reason: shortNote,
      actionLabel: "Клиент",
      attentionPriority: ATTENTION_PRIORITY_PAYMENT_NOTE,
      href: `/clients/${encodeURIComponent(n.clientId)}`,
      clientId: n.clientId,
    });
  }

  items.sort((a, b) => a.attentionPriority - b.attentionPriority || a.title.localeCompare(b.title));
  return items;
}
