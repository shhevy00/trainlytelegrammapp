"use client";

import Link from "next/link";
import { useMemo, type ReactElement } from "react";
import { Card } from "@/components/ui/card";
import { formatJournalDayLabel, formatJournalTime } from "@/lib/mock/journalSeed";
import { ScreenQuickBar } from "@/components/shell/ScreenQuickBar";
import { ProductAccessPaywall } from "@/components/shell/ProductAccessPaywall";
import type { TrainlyDataSource } from "@/lib/config/dataSource";
import { useMockApp } from "@/lib/mock/MockAppProvider";
import { QUICK_ACTIONS_FOR_SCREEN } from "@/lib/navigation/quickActions";
import type { JournalCompletedWorkout, JournalEntry } from "@/lib/types";

function dayBucketKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function workoutStatsSubtitle(entry: JournalCompletedWorkout): string {
  const ex = entry.exercises.length;
  const filled = entry.filledSetCount;
  if (filled === 0) {
    return "Без заполненных подходов.";
  }
  const parts: string[] = [];
  if (ex > 0) parts.push(`${ex} упр.`);
  parts.push(`${filled} подходов`);
  const base = parts.join(" · ");
  if (entry.volumeKg != null && entry.volumeKg > 0) {
    return `${base} · ${entry.volumeKg.toLocaleString("ru-RU")} кг`;
  }
  return base;
}

function groupByDay(entries: JournalEntry[]): Map<string, JournalEntry[]> {
  const map = new Map<string, JournalEntry[]>();
  for (const e of entries) {
    const k = dayBucketKey(e.createdAtMs);
    const arr = map.get(k) ?? [];
    arr.push(e);
    map.set(k, arr);
  }
  return map;
}

export function JournalPageContent({ trainlyDataMode }: { trainlyDataMode: TrainlyDataSource }): ReactElement {
  const { journalEntries } = useMockApp();

  const sorted = useMemo(
    () => [...journalEntries].sort((a, b) => b.createdAtMs - a.createdAtMs),
    [journalEntries],
  );

  const groups = useMemo(() => groupByDay(sorted), [sorted]);

  const orderedDayKeys = useMemo(() => {
    const keys = [...groups.keys()];
    keys.sort((a, b) => b.localeCompare(a));
    return keys;
  }, [groups]);

  return (
    <main className="flex min-w-0 w-full flex-col gap-4 px-4 py-6 pb-[calc(6rem+max(0.35rem,env(safe-area-inset-bottom,0px)))]">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight">Журнал</h1>
        <p className="mt-1 text-sm text-[var(--tg-muted)]">Завершённые тренировки и заметки по датам.</p>
      </header>

      <ProductAccessPaywall trainlyDataMode={trainlyDataMode} />

      <ScreenQuickBar actionIds={QUICK_ACTIONS_FOR_SCREEN.journal} />

      {sorted.length === 0 ? (
        <Card className="trainly-surface-card flex flex-col gap-4">
          <div>
            <p className="font-medium text-[var(--text-primary)]">В журнале пока нет тренировок.</p>
            <p className="mt-1 text-sm text-[var(--tg-muted)]">Здесь появятся завершённые занятия и заметки.</p>
          </div>
          <Link
            href="/start-workout?mode=quick"
            className="app-btn min-h-[44px] rounded-2xl bg-[var(--tg-accent)] px-4 py-3 text-center text-[15px] font-semibold text-white shadow-app-primary"
            prefetch={false}
          >
            Начать тренировку
          </Link>
        </Card>
      ) : null}

      <div className="flex flex-col gap-6">
        {orderedDayKeys.map((dayKey) => {
          const list = groups.get(dayKey) ?? [];
          const first = list[0];
          if (!first) return null;
          const labelMs = first.createdAtMs;
          return (
            <section key={dayKey}>
              <h2 className="app-section-label mb-3">{formatJournalDayLabel(labelMs)}</h2>
              <ul className="flex flex-col gap-3">
                {list.map((entry) => (
                  <li key={entry.id}>
                    <Link href={`/workouts/${entry.id}`} prefetch={false} className="block">
                      <Card className="trainly-surface-card transition hover:border-[color:color-mix(in_srgb,var(--brand-solid),transparent_50%)]">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs text-[var(--tg-muted)]">{formatJournalTime(entry.createdAtMs)}</p>
                            <p className="mt-1 font-display font-semibold">{entry.clientName}</p>
                            <p className="text-sm text-[var(--tg-muted)]">{entry.title}</p>
                          </div>
                          <span className="shrink-0 rounded-full bg-[var(--tg-bg)] px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-[var(--tg-muted)]">
                            {entry.kind === "note" ? "Заметка" : "Тренировка"}
                          </span>
                        </div>
                        {entry.kind === "workout" ? (
                          <div className="mt-3 text-sm">
                            <p className="text-[var(--tg-muted)]">{workoutStatsSubtitle(entry)}</p>
                            {entry.summaryHint ? (
                              <span className="mt-1 block text-xs font-medium text-[var(--text-muted)]">{entry.summaryHint}</span>
                            ) : null}
                          </div>
                        ) : (
                          <p className="mt-3 text-sm text-[var(--tg-muted)]">Заметка без подходов</p>
                        )}
                      </Card>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}
