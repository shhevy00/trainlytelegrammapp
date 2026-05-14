import type { MockClient } from "@/lib/mock/data";
import type { ClientProfileScenario } from "@/lib/mock/clientProfileScenario";
import { resolveCoachPaidSessionsState } from "@/lib/coach/paidSessions";
import type { JournalCompletedWorkout } from "@/lib/types";
import type { WorkoutExercise } from "@/lib/workout/types";

/** Укороченное обращение без полного ФИО (конфиденциальность). */
export function clientAliasFromName(fullName: string): string {
  const t = fullName.trim();
  if (!t) return "Клиент";
  return t.split(/\s+/)[0] ?? "Клиент";
}

function paidStateFact(remainingSessions: number): string {
  const st = resolveCoachPaidSessionsState(remainingSessions);
  switch (st) {
    case "debt":
      if (remainingSessions < 0) {
        const d = Math.abs(remainingSessions);
        return `Долг: ${d} занятий (перерасход оплаченных).`;
      }
      return "Осталось занятий: долг (перерасход).";
    case "zero_sessions":
      return "Осталось занятий: 0.";
    case "low_sessions":
      return "Осталось занятий: 1.";
    default:
      return `Осталось занятий: ${remainingSessions}.`;
  }
}

function profileSituationRu(scenario: ClientProfileScenario): string {
  switch (scenario) {
    case "workout_today":
      return "сегодня есть тренировка по плану";
    case "inactive":
      return "давно не было тренировок";
    case "no_next_workout":
      return "в графике нет следующей записи";
    case "zero_sessions":
      return "закончились оплаченные занятия";
    case "debt":
      return "есть долг по оплаченным занятиям";
    default:
      return "ведение в обычном режиме";
  }
}

/** Факты для Pulse / сводок (без телефона, username, диагнозов, реквизитов). */
export function buildPulseFacts(input: {
  client: MockClient;
  scenario: ClientProfileScenario;
  journalWorkoutCount: number;
  journalNoteCount: number;
}): string[] {
  const { client, scenario, journalWorkoutCount, journalNoteCount } = input;
  const alias = clientAliasFromName(client.name);
  const facts: string[] = [
    `Клиент (обращение): ${alias}.`,
    paidStateFact(client.remainingSessions),
    `Неактивность: около ${client.inactiveDays} дн.`,
    client.hasNextWorkoutScheduled
      ? "В графике есть следующая запись."
      : "В графике нет следующей записи.",
    `Сводка ситуации: ${profileSituationRu(scenario)}.`,
    `Журнал: завершённых тренировок ${journalWorkoutCount}, заметок без подходов ${journalNoteCount}.`,
  ];
  if (client.goal?.trim()) facts.push(`Цель (как указано): ${client.goal.trim()}.`);
  if (client.limitation?.trim()) {
    facts.push(`Ограничение / осторожность (как указано): ${client.limitation.trim()}.`);
  }
  if (client.lastWorkoutSummary?.trim()) {
    facts.push(`Последняя активность (как в профиле): ${client.lastWorkoutSummary.trim()}.`);
  }
  return facts;
}

/** Короткие факты для ИИ на вкладке «Пульс» профиля (без сценария/журнала в формулировках). */
export function buildPulseFactsCompactForProfile(client: MockClient): string[] {
  const alias = clientAliasFromName(client.name);
  const facts: string[] = [
    `Клиент: ${alias}.`,
    paidStateFact(client.remainingSessions),
    `Без тренировок ≈ ${client.inactiveDays} дн.`,
    client.hasNextWorkoutScheduled ? "В графике есть следующая запись." : "В графике нет следующей записи.",
  ];
  if (client.goal?.trim()) facts.push(`Цель: ${client.goal.trim()}.`);
  if (client.limitation?.trim()) facts.push(`Ограничение: ${client.limitation.trim()}.`);
  if (client.lastWorkoutSummary?.trim()) {
    facts.push(`Последняя тренировка: ${client.lastWorkoutSummary.trim()}.`);
  }
  return facts;
}

export function buildPreWorkoutFacts(input: {
  client: MockClient;
  rememberFactsLines: readonly string[];
}): string[] {
  const alias = clientAliasFromName(input.client.name);
  const base: string[] = [
    `Клиент: ${alias}.`,
    paidStateFact(input.client.remainingSessions),
  ];
  if (input.client.limitation?.trim()) {
    base.push(`Ограничение: ${input.client.limitation.trim()}.`);
  }
  if (input.rememberFactsLines.length > 0) {
    base.push("Факты из блока «Что помнить»:");
    base.push(...input.rememberFactsLines.map((l) => `— ${l}`));
  }
  return base;
}

function formatExerciseFactLines(exercises: readonly WorkoutExercise[]): string[] {
  const lines: string[] = [];
  for (const ex of exercises) {
    if (ex.skipped) continue;
    const doneSets = ex.sets.filter((s) => s.done);
    if (doneSets.length === 0) continue;
    const parts = doneSets.map((s) => {
      const w = s.weight.trim();
      const r = s.reps.trim();
      if (w && r) return `${w}×${r}`;
      if (r) return `${r} повт.`;
      if (w) return `${w} кг`;
      return "отметка без чисел";
    });
    lines.push(`${ex.name}: ${parts.join(", ")}`);
  }
  return lines;
}

/** Только данные завершённой тренировки из журнала (без выдумки). */
export function buildPostWorkoutFacts(entry: JournalCompletedWorkout): string[] {
  const alias = clientAliasFromName(entry.clientName);
  const facts: string[] = [
    `Клиент: ${alias}.`,
    `Название тренировки: ${entry.title}.`,
    `Длительность: ${entry.durationMin} мин.`,
    `Подходов с отметкой «сделано»: ${entry.filledSetCount}.`,
    `Упражнений в структуре: ${entry.exercises.filter((e) => !e.skipped).length}.`,
  ];
  if (entry.volumeKg === null) {
    facts.push("Объём не рассчитан.");
  } else {
    facts.push(`Объём (по журналу): ${entry.volumeKg} кг.`);
  }
  if (entry.summaryHint.trim()) {
    facts.push(`Итог тренировки (из журнала): ${entry.summaryHint.trim()}.`);
  }
  const exLines = formatExerciseFactLines(entry.exercises);
  if (exLines.length > 0) {
    facts.push("Упражнения (только заполненные отметки):");
    facts.push(...exLines.map((l) => `— ${l}`));
  }
  if (entry.workoutComment.trim()) {
    facts.push(`Комментарий тренера к тренировке: ${entry.workoutComment.trim()}`);
  }
  return facts;
}

export function buildPaymentReminderFacts(client: MockClient): string[] {
  const alias = clientAliasFromName(client.name);
  return [
    `Клиент: ${alias}.`,
    paidStateFact(client.remainingSessions),
    client.hasNextWorkoutScheduled
      ? "В графике есть следующая запись."
      : "В графике нет следующей записи.",
  ];
}

export function buildInactiveClientFacts(client: MockClient): string[] {
  const alias = clientAliasFromName(client.name);
  const facts: string[] = [
    `Клиент: ${alias}.`,
    `Дней без тренировок: ${client.inactiveDays}.`,
    client.hasNextWorkoutScheduled
      ? "В графике есть следующая запись."
      : "В графике нет следующей записи.",
  ];
  if (client.lastWorkoutSummary?.trim()) {
    facts.push(`Последняя активность (как в профиле): ${client.lastWorkoutSummary.trim()}.`);
  } else {
    facts.push("Последняя активность в профиле не указана.");
  }
  return facts;
}

/** Заметка без подходов — только факты формата сессии. */
/** Если запись журнала недоступна — только сводка с экрана итога. */
export function buildPostWorkoutFactsFromSummary(input: {
  clientName: string;
  title: string;
  durationMin: number;
  filledSets: number;
  exerciseCount: number;
  volumeKg: number | null;
  hint: string;
}): string[] {
  const alias = clientAliasFromName(input.clientName);
  return [
    `Клиент: ${alias}.`,
    `Название тренировки: ${input.title}.`,
    `Длительность: ${input.durationMin} мин.`,
    `Подходов с отметкой «сделано»: ${input.filledSets}.`,
    `Упражнений (по сводке): ${input.exerciseCount}.`,
    input.volumeKg === null
      ? "Объём не рассчитан."
      : `Объём (по сводке): ${input.volumeKg} кг.`,
    input.hint.trim() ? `Итог тренировки (по сводке): ${input.hint.trim()}.` : "Итог тренировки в сводке не указан.",
  ];
}

export function buildPostNoteSessionFacts(input: {
  clientName: string;
  title: string;
  durationMin: number;
}): string[] {
  const alias = clientAliasFromName(input.clientName);
  return [
    `Клиент: ${alias}.`,
    `Формат: заметка без подходов.`,
    `Заголовок: ${input.title}.`,
    `Длительность (оценка): ${input.durationMin} мин.`,
  ];
}
