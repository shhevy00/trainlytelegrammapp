import type { MockClient, MockScheduleItem } from "@/lib/mock/data";
import { formatLastWorkoutCompact, limitationShort } from "@/lib/overview/preWorkoutContext";

export type OverviewRememberChipTone = "neutral" | "warning" | "info";

export type OverviewRememberChip = {
  id: string;
  label: string;
  tone?: OverviewRememberChipTone;
};

function balanceChip(client: MockClient): OverviewRememberChip {
  const n = client.remainingSessions;
  if (n < 0) {
    return {
      id: "balance",
      label: `Долг ${Math.abs(n)}`,
      tone: "warning",
    };
  }
  if (n === 0) {
    return { id: "balance", label: "0 занятий", tone: "warning" };
  }
  return { id: "balance", label: `Осталось ${n}`, tone: "neutral" };
}

/** До 3 коротких чипов для hero «Следующая тренировка». */
export function buildOverviewRememberChips(
  client: MockClient,
  nextSlot: MockScheduleItem,
): OverviewRememberChip[] {
  void nextSlot;
  const chips: OverviewRememberChip[] = [];

  if (client.completedWorkoutsCount === 0) {
    chips.push({ id: "first", label: "Первая тренировка", tone: "info" });
    chips.push(balanceChip(client));
    const last = formatLastWorkoutCompact(client.lastWorkoutSummary);
    if (last) chips.push({ id: "last", label: last, tone: "neutral" });
    return chips.slice(0, 3);
  }

  chips.push(balanceChip(client));

  const lim = limitationShort(client.limitation);
  if (lim) {
    chips.push({ id: "limitation", label: lim, tone: "neutral" });
  }

  const last = formatLastWorkoutCompact(client.lastWorkoutSummary);
  if (last) {
    chips.push({ id: "last", label: last, tone: "neutral" });
  }

  return chips.slice(0, 3);
}
