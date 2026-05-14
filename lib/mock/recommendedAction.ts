import type { MockClient } from "@/lib/mock/data";

export type RecommendedKind =
  | "start"
  | "remind"
  | "message"
  | "schedule"
  | "first_workout"
  | "open";

export interface RecommendedAction {
  kind: RecommendedKind;
  label: string;
}

/** Правила PRODUCT_FLOWS / UI_STRUCTURE (приоритет сверху вниз). */
export function getRecommendedAction(client: MockClient): RecommendedAction {
  if (client.hasWorkoutToday) {
    return { kind: "start", label: "Начать" };
  }
  if (client.remainingSessions < 0) {
    return { kind: "remind", label: "Добавить оплату" };
  }
  if (client.remainingSessions <= 1) {
    return { kind: "remind", label: "Напомнить" };
  }
  if (client.inactiveDays >= 10) {
    return { kind: "message", label: "Написать" };
  }
  if (!client.hasNextWorkoutScheduled) {
    return { kind: "schedule", label: "В график" };
  }
  if (client.completedWorkoutsCount === 0) {
    return { kind: "first_workout", label: "Первая тренировка" };
  }
  return { kind: "open", label: "Открыть" };
}

/** Короткая подсказка для UI (не главная кнопка). */
export function getRecommendedCoachHint(client: MockClient): string | null {
  const rec = getRecommendedAction(client);
  switch (rec.kind) {
    case "start":
      return null;
    case "remind":
      return client.remainingSessions < 0
        ? "Долг по занятиям — примите оплату."
        : "Напомните об оплате или продлении.";
    case "message":
      return "Давно без тренировки — напишите клиенту.";
    case "schedule":
      return "Нет следующей записи в графике.";
    case "first_workout":
      return "Первая тренировка ещё не в журнале.";
    case "open":
      return null;
  }
}
