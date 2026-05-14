import type { CoachQuickNote } from "@/lib/mock/coachLedger";
import type { MockClient } from "@/lib/mock/data";

export interface RememberBlockOptions {
  /** Пользователь подтвердил старт при нуле оплаченных занятий. */
  debtAcknowledged?: boolean;
}

function rememberLinesFromQuickNotes(notes: CoachQuickNote[]): string[] {
  const lines: string[] = [];
  const sorted = [...notes].sort((a, b) => b.createdAtMs - a.createdAtMs);
  for (const n of sorted) {
    const t = n.text.trim();
    if (t.length === 0) continue;
    if (n.type === "limitation") lines.push(`Заметка · ограничение: ${t}`);
    else if (n.type === "complaint") lines.push(`Жалоба: ${t}`);
    else if (n.type === "payment") lines.push(`Оплата: ${t}`);
  }
  return lines;
}

export function buildRememberBlock(
  client: MockClient,
  options: RememberBlockOptions = {},
  coachQuickNotes: CoachQuickNote[] = [],
): string {
  const parts: string[] = [];
  if (client.limitation && client.limitation.trim().length > 0) {
    parts.push(`Ограничение: ${client.limitation}`);
  }
  parts.push(
    client.remainingSessions < 0
      ? `Долг: ${Math.abs(client.remainingSessions)} занятий (остаток ${client.remainingSessions})`
      : client.remainingSessions === 0
        ? "Оплаченных занятий: 0"
        : `Осталось занятий: ${client.remainingSessions}`,
  );
  if (client.lastWorkoutSummary && client.lastWorkoutSummary.trim().length > 0) {
    parts.push(`Последняя тренировка: ${client.lastWorkoutSummary}`);
  }
  if (options.debtAcknowledged && client.remainingSessions <= 0) {
    parts.push("Старт при нуле/долге: при завершении тренировки спишется 1 занятие");
  }
  parts.push(...rememberLinesFromQuickNotes(coachQuickNotes));
  return parts.join(" · ");
}
