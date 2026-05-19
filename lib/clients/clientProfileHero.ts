import {
  coachClientSessionsBalanceShortRu,
  resolveCoachPaidSessionsState,
  type CoachPaidSessionsState,
} from "@/lib/coach/paidSessions";
import { clientInitial } from "@/lib/clients/clientListUi";
import type { MockClient, MockScheduleItem } from "@/lib/mock/data";
import { formatScheduleSlotHuman, type ClientProfileScenario } from "@/lib/mock/clientProfileScenario";

export interface ClientProfileHeroAction {
  kind: "link" | "button";
  label: string;
  href?: string;
  variant: "primary" | "secondary";
}

export interface ClientProfileHeroModel {
  initial: string;
  name: string;
  goalLine: string | null;
  headline: string;
  subline: string | null;
  limitationLine: string | null;
  balanceLabel: string;
  balanceTone: CoachPaidSessionsState;
  primary: ClientProfileHeroAction;
  secondary: readonly ClientProfileHeroAction[];
  showRepeatHint: boolean;
  showGoalUnderName: boolean;
}

function shortText(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function templatesCountLabel(n: number): string {
  if (n === 0) return "Нет шаблонов";
  if (n === 1) return "1 шаблон";
  if (n >= 2 && n <= 4) return `${n} шаблона`;
  return `${n} шаблонов`;
}

export { templatesCountLabel };

export function buildClientProfileHeroModel(input: {
  client: MockClient;
  scenario: ClientProfileScenario;
  todayIso: string;
  todaySlots: readonly MockScheduleItem[];
  nextSlot: MockScheduleItem | undefined;
  journalWorkoutCount: number;
  canRepeat: boolean;
  startHref: string;
  addPaymentHref: string;
  quickNoteHref: string;
  scheduleHref: string;
}): ClientProfileHeroModel {
  const {
    client,
    scenario,
    todayIso,
    todaySlots,
    nextSlot,
    journalWorkoutCount,
    canRepeat,
    startHref,
    addPaymentHref,
    quickNoteHref,
    scheduleHref,
  } = input;

  const balanceTone = resolveCoachPaidSessionsState(client.remainingSessions);
  const balanceLabel = coachClientSessionsBalanceShortRu(client.remainingSessions);
  const goalLine = client.goal?.trim() ? shortText(client.goal, 100) : null;
  const limitationLine = client.limitation?.trim() ? shortText(client.limitation, 120) : null;

  const link = (label: string, href: string, variant: ClientProfileHeroAction["variant"]): ClientProfileHeroAction => ({
    kind: "link",
    label,
    href,
    variant,
  });

  const repeatBtn: ClientProfileHeroAction = { kind: "button", label: "Повторить", variant: "secondary" };

  switch (scenario) {
    case "workout_today": {
      const slot = todaySlots[0] ?? nextSlot;
      const headline = slot
        ? formatScheduleSlotHuman(slot, todayIso)
        : "Сегодня — уточните время в графике";
      const secondary: ClientProfileHeroAction[] = canRepeat
        ? [repeatBtn]
        : [];
      return {
        initial: clientInitial(client.name),
        name: client.name,
        goalLine,
        headline,
        subline: balanceLabel,
        limitationLine,
        balanceLabel,
        balanceTone,
        primary: link("Начать тренировку", startHref, "primary"),
        secondary,
        showRepeatHint: !canRepeat,
        showGoalUnderName: Boolean(goalLine),
      };
    }
    case "inactive":
      return {
        initial: clientInitial(client.name),
        name: client.name,
        goalLine,
        headline: `${client.inactiveDays} дн. без тренировок`,
        subline: balanceLabel,
        limitationLine,
        balanceLabel,
        balanceTone,
        primary: link("Написать клиенту", quickNoteHref, "primary"),
        secondary: [link("Запланировать", scheduleHref, "secondary"), link("Начать", startHref, "secondary")],
        showRepeatHint: false,
        showGoalUnderName: Boolean(goalLine),
      };
    case "no_next_workout":
      return {
        initial: clientInitial(client.name),
        name: client.name,
        goalLine,
        headline: "Нет записи в графике",
        subline: balanceLabel,
        limitationLine,
        balanceLabel,
        balanceTone,
        primary: link("Открыть график", scheduleHref, "primary"),
        secondary: [link("Начать без записи", startHref, "secondary")],
        showRepeatHint: false,
        showGoalUnderName: Boolean(goalLine),
      };
    case "zero_sessions":
      return {
        initial: clientInitial(client.name),
        name: client.name,
        goalLine,
        headline: "Оплаченных занятий не осталось",
        subline: "Добавьте оплату, чтобы продолжить вести занятия.",
        limitationLine,
        balanceLabel,
        balanceTone,
        primary: link("Добавить оплату", addPaymentHref, "primary"),
        secondary: [link("Заметка", quickNoteHref, "secondary"), link("Начать", startHref, "secondary")],
        showRepeatHint: false,
        showGoalUnderName: Boolean(goalLine),
      };
    case "debt":
      return {
        initial: clientInitial(client.name),
        name: client.name,
        goalLine,
        headline: balanceLabel,
        subline: "При завершении тренировки спишется одно занятие с баланса.",
        limitationLine,
        balanceLabel,
        balanceTone,
        primary: link("Добавить оплату", addPaymentHref, "primary"),
        secondary: [link("Начать тренировку", startHref, "secondary")],
        showRepeatHint: false,
        showGoalUnderName: Boolean(goalLine),
      };
    default: {
      const headline = nextSlot
        ? `Дальше: ${formatScheduleSlotHuman(nextSlot, todayIso)}`
        : goalLine
          ? `Цель: ${goalLine}`
          : "Продолжайте по плану";
      const subParts: string[] = [balanceLabel];
      if (client.lastWorkoutSummary) subParts.push(`Последняя: ${shortText(client.lastWorkoutSummary, 48)}`);
      const secondary: ClientProfileHeroAction[] = [];
      if (canRepeat) secondary.push(repeatBtn);
      secondary.push(link("Заметка", quickNoteHref, "secondary"));
      const startLabel =
        client.completedWorkoutsCount === 0 && journalWorkoutCount === 0 ? "Первая тренировка" : "Начать";
      return {
        initial: clientInitial(client.name),
        name: client.name,
        goalLine: nextSlot ? goalLine : null,
        headline,
        subline: subParts.join(" · "),
        limitationLine,
        balanceLabel,
        balanceTone,
        primary: link(startLabel, startHref, "primary"),
        secondary,
        showRepeatHint: !canRepeat,
        showGoalUnderName: Boolean(nextSlot && goalLine),
      };
    }
  }
}
