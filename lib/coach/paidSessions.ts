/** Учёт оплаченных занятий между тренером и клиентом (не биллинг Trainly). */

function nounSessionsRu(abs: number): string {
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 14) return "занятий";
  if (mod10 === 1) return "занятие";
  if (mod10 >= 2 && mod10 <= 4) return "занятия";
  return "занятий";
}

/** Краткая строка баланса для карточек и подписей (остаток может быть отрицательным). */
export function coachClientSessionsBalanceShortRu(remainingSessions: number): string {
  if (remainingSessions < 0) {
    const d = Math.abs(remainingSessions);
    return `Долг: ${d} ${nounSessionsRu(d)}`;
  }
  if (remainingSessions === 0) return "0 занятий";
  return `Осталось: ${remainingSessions}`;
}

export type CoachPaidSessionsState = "paid_stable" | "low_sessions" | "zero_sessions" | "debt";

export function resolveCoachPaidSessionsState(remainingSessions: number): CoachPaidSessionsState {
  if (remainingSessions < 0) return "debt";
  if (remainingSessions === 0) return "zero_sessions";
  if (remainingSessions === 1) return "low_sessions";
  return "paid_stable";
}

export function coachPaidSessionsLabelRu(state: CoachPaidSessionsState): string {
  switch (state) {
    case "debt":
      return "Долг по занятиям (проведено больше оплаченных)";
    case "zero_sessions":
      return "Оплаченных занятий не осталось";
    case "low_sessions":
      return "Мало оплаченных занятий";
    default:
      return "Оплаченные занятия в норме";
  }
}

/** Короткий статус для карточки «Оплаты» в профиле. */
export function coachPaidSessionsHeadlineRu(
  state: CoachPaidSessionsState,
  remainingSessions?: number,
): string {
  switch (state) {
    case "debt":
      if (remainingSessions != null && remainingSessions < 0) {
        const d = Math.abs(remainingSessions);
        return `Долг: ${d} ${nounSessionsRu(d)}`;
      }
      return "Долг по занятиям";
    case "zero_sessions":
      return "Занятия закончились";
    case "low_sessions":
      return "Скоро оплата";
    default:
      return "Всё в норме";
  }
}

/** Списать одно оплаченное занятие при завершённой тренировке (mock): без clamp, баланс может уйти в минус. */
export function spendOneClientSessionBalance(remainingSessions: number): number {
  return remainingSessions - 1;
}
