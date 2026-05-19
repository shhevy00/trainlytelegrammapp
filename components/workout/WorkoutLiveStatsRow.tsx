"use client";

import type { ReactElement } from "react";
import type { WorkoutLiveSessionStats } from "@/lib/workout/liveSessionStats";

interface WorkoutLiveStatsRowProps {
  stats: WorkoutLiveSessionStats;
}

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}): ReactElement {
  return (
    <div className="flex min-w-0 flex-1 flex-col justify-between rounded-[var(--radius-card)] border border-[color:var(--border-soft)] bg-[color:color-mix(in_srgb,var(--bg-card),transparent_4%)] px-3 py-2.5 shadow-[var(--shadow-elevated)]">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 truncate font-display text-lg font-bold tabular-nums leading-none text-[var(--text-primary)]">
        {value}
      </p>
      {hint ? <p className="mt-1 truncate text-[10px] text-[var(--text-muted)]">{hint}</p> : null}
    </div>
  );
}

export function WorkoutLiveStatsRow({ stats }: WorkoutLiveStatsRowProps): ReactElement {
  return (
    <section
      className="premium-surface grid grid-cols-2 gap-2 p-2 sm:grid-cols-4"
      aria-label="Показатели сессии"
    >
      <StatTile label="Объём" value={stats.volumeLabel} />
      <StatTile label="Упражнений" value={stats.exerciseCount} />
      <StatTile label="Подходов" value={stats.filledSets} hint="заполнено" />
      <StatTile label="Время" value={stats.elapsedLabel} />
    </section>
  );
}
