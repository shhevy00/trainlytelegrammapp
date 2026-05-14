import type { MockClient, MockScheduleItem } from "@/lib/mock/data";
import type { ClientProfileScenario } from "@/lib/mock/clientProfileScenario";
import { formatScheduleSlotHuman } from "@/lib/mock/clientProfileScenario";
import type { CoachQuickNote } from "@/lib/mock/coachLedger";
import { coachClientSessionsBalanceShortRu, coachPaidSessionsLabelRu, resolveCoachPaidSessionsState } from "@/lib/coach/paidSessions";
import { isoDayLocal, parseLocalDay } from "@/lib/overview/dailyOperations";

export interface ClientPulseInput {
  client: MockClient;
  scenario: ClientProfileScenario;
  todaySlots: MockScheduleItem[];
  nextSlot: MockScheduleItem | undefined;
  quickNotes: CoachQuickNote[];
  lastWorkoutAtMs: number | null;
  /** Число завершённых тренировок в журнале (источник правды для «новый клиент»). */
  journalCompletedWorkouts: number;
  mockTodayIso: string;
  startWorkoutHref: string;
  addPaymentHref: string;
  quickNoteHref: string;
}

export interface ClientPulseNextAction {
  label: string;
  href: string;
}

export interface ClientPulseDetailBucket {
  id: string;
  title: string;
  lines: string[];
}

export interface ClientPulseCompact {
  mainNow: string;
  chips: string[];
  primaryAction: ClientPulseNextAction;
  secondaryAction: ClientPulseNextAction | null;
  detailBuckets: ClientPulseDetailBucket[];
}

function sortNotesDesc(notes: CoachQuickNote[]): CoachQuickNote[] {
  return [...notes].sort((a, b) => b.createdAtMs - a.createdAtMs);
}

function shortText(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/** Сколько календарных дней между днём события и «сегодня» (todayIso), событие в прошлом → положительное число. */
function calendarDaysAgo(eventMs: number, todayIso: string): number {
  const eventDay = isoDayLocal(eventMs);
  const a = parseLocalDay(eventDay).getTime();
  const b = parseLocalDay(todayIso).getTime();
  return Math.round((b - a) / 86_400_000);
}

function relativeWorkoutChip(lastMs: number | null, todayIso: string): string | null {
  if (lastMs == null) return null;
  const diff = calendarDaysAgo(lastMs, todayIso);
  if (diff === 0) return "Был сегодня";
  if (diff === 1) return "Был вчера";
  if (diff > 0 && diff <= 21) return `Был ${diff} дн. назад`;
  return null;
}

/** Компактный пульс: главное, чипы, действие, детали для раскрытия (без технарского текста). */
export function buildClientPulseCompact(input: ClientPulseInput): ClientPulseCompact {
  const {
    client,
    scenario,
    todaySlots,
    nextSlot,
    quickNotes,
    lastWorkoutAtMs,
    journalCompletedWorkouts,
    mockTodayIso,
    startWorkoutHref,
    addPaymentHref,
    quickNoteHref,
  } = input;

  const paidState = resolveCoachPaidSessionsState(client.remainingSessions);
  const paidLabel = coachPaidSessionsLabelRu(paidState);

  const chipsSet = new Set<string>();

  if (client.remainingSessions < 0) chipsSet.add(`Долг: ${Math.abs(client.remainingSessions)}`);
  else if (client.remainingSessions === 0) chipsSet.add("0 занятий");
  else if (client.remainingSessions === 1) chipsSet.add("Осталось 1");
  else chipsSet.add(`Осталось ${client.remainingSessions}`);

  if (client.hasWorkoutToday) chipsSet.add("Сегодня");
  if (client.limitation) chipsSet.add(shortText(`Ограничение: ${client.limitation}`, 36));
  if (!client.hasNextWorkoutScheduled) chipsSet.add("Без записи");
  if (client.inactiveDays >= 10 && scenario !== "inactive") {
    chipsSet.add(`Давно не был · ${client.inactiveDays} дн.`);
  }

  const rel = relativeWorkoutChip(lastWorkoutAtMs, mockTodayIso);
  if (rel) chipsSet.add(rel);

  for (const n of sortNotesDesc(quickNotes)) {
    const t = n.text.trim();
    if (!t) continue;
    if (n.type === "payment") chipsSet.add(shortText(`Оплата в заметках: ${t}`, 40));
    else if (n.type === "limitation") chipsSet.add(shortText(`Ограничение в заметке: ${t}`, 40));
    else if (n.type === "complaint") chipsSet.add(shortText(`Жалоба: ${t}`, 36));
    else if (n.type === "progress") chipsSet.add(shortText(`Прогресс: ${t}`, 36));
    else if (n.type === "general") chipsSet.add(shortText(`Заметка: ${t}`, 40));
  }

  const chips = [...chipsSet].slice(0, 4);

  let mainNow = "";
  let primaryAction: ClientPulseNextAction;
  let secondaryAction: ClientPulseNextAction | null = null;

  const scheduleHref = "/schedule";

  switch (scenario) {
    case "workout_today": {
      const slot = todaySlots[0];
      if (slot) {
        mainNow = `Сегодня ${slot.time} · ${slot.title}.${client.limitation ? ` Учесть: ${shortText(client.limitation, 56)}.` : ""}`;
      } else if (nextSlot) {
        mainNow = `Ближайшее в графике: ${formatScheduleSlotHuman(nextSlot, mockTodayIso)}.`;
      } else {
        mainNow = "Сегодня тренировка по плану — уточните время в графике.";
      }
      primaryAction = { label: "Начать", href: startWorkoutHref };
      secondaryAction = { label: "График", href: scheduleHref };
      break;
    }
    case "inactive": {
      mainNow = `${client.inactiveDays} дн. без тренировок.${client.goal ? ` ${shortText(client.goal, 48)}` : ""}`;
      primaryAction = { label: "Написать", href: quickNoteHref };
      secondaryAction = { label: "В график", href: scheduleHref };
      break;
    }
    case "no_next_workout": {
      mainNow = "Нет следующей записи в графике — стоит назначить тренировку.";
      primaryAction = { label: "В график", href: scheduleHref };
      secondaryAction = { label: "Начать", href: startWorkoutHref };
      break;
    }
    case "debt": {
      const d = Math.abs(client.remainingSessions);
      mainNow = `Долг: ${d} занятий — примите оплату или продолжайте фиксировать перерасход.`;
      primaryAction = { label: "Добавить оплату", href: addPaymentHref };
      secondaryAction = { label: "Начать", href: startWorkoutHref };
      break;
    }
    case "zero_sessions": {
      mainNow = "Занятия закончились — примите оплату или зафиксируйте долг.";
      primaryAction = { label: "Добавить оплату", href: addPaymentHref };
      secondaryAction = { label: "Заметка", href: quickNoteHref };
      break;
    }
    default: {
      if (journalCompletedWorkouts === 0) {
        mainNow = "Новый клиент. Начните первую тренировку.";
      } else if (client.inactiveDays >= 10) {
        mainNow = `Клиент давно не был (${client.inactiveDays} дн.) — стоит назначить следующую тренировку.`;
      } else if (client.limitation?.trim()) {
        mainNow = shortText(`Учесть: ${client.limitation}. ${coachClientSessionsBalanceShortRu(client.remainingSessions)}.`, 140);
      } else if (nextSlot) {
        mainNow = shortText(`Дальше в графике: ${formatScheduleSlotHuman(nextSlot, mockTodayIso)}.`, 120);
      } else if (client.goal) {
        mainNow = shortText(`Цель: ${client.goal}.`, 120);
      } else {
        mainNow = "Продолжайте вести клиента по плану.";
      }
      if (journalCompletedWorkouts === 0) {
        primaryAction = { label: "Начать тренировку", href: startWorkoutHref };
      } else {
        primaryAction = { label: "Начать", href: startWorkoutHref };
      }
      secondaryAction = { label: "График", href: scheduleHref };
      break;
    }
  }

  const trainingLines: string[] = [];
  if (client.lastWorkoutSummary) {
    trainingLines.push(`Последняя тренировка: ${client.lastWorkoutSummary}`);
  }
  if (nextSlot) {
    trainingLines.push(`Следующая запись в графике: ${formatScheduleSlotHuman(nextSlot, mockTodayIso)}`);
  } else if (scenario !== "no_next_workout") {
    trainingLines.push("Следующая запись в графике пока не отмечена.");
  }

  const moneyLines: string[] = [coachClientSessionsBalanceShortRu(client.remainingSessions), paidLabel];

  const noteLines: string[] = sortNotesDesc(quickNotes)
    .map((n) => {
      const t = n.text.trim();
      if (!t) return null;
      const kindRu =
        n.type === "payment"
          ? "Оплата"
          : n.type === "limitation"
            ? "Ограничение"
            : n.type === "progress"
              ? "Прогресс"
              : n.type === "complaint"
                ? "Жалоба"
                : "Заметка";
      return `${kindRu}: ${shortText(t, 100)}`;
    })
    .filter((x): x is string => x != null);

  const controlLines: string[] = [];
  if (client.remainingSessions < 0) controlLines.push("Зафиксирован перерасход оплаченных занятий.");
  if (client.remainingSessions === 0) controlLines.push("Добавьте оплату, чтобы продолжать списание занятий.");

  const detailBuckets: ClientPulseDetailBucket[] = [
    {
      id: "training",
      title: "Тренировки",
      lines: trainingLines.length > 0 ? trainingLines : ["Пока без сводки по последним тренировкам."],
    },
    { id: "money", title: "Оплата", lines: moneyLines },
  ];

  if (noteLines.length > 0) {
    detailBuckets.push({ id: "notes", title: "Заметки тренера", lines: noteLines });
  }

  if (controlLines.length > 0) {
    detailBuckets.push({ id: "control", title: "Контроль", lines: controlLines });
  }

  return {
    mainNow,
    chips,
    primaryAction,
    secondaryAction,
    detailBuckets,
  };
}
