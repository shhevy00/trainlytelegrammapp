"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { WorkoutSheetFrame } from "@/components/workout/WorkoutSheetFrame";
import type { ExerciseHistoryDemo } from "@/lib/mock/workoutDemo";

interface HistorySheetProps {
  open: boolean;
  onClose: () => void;
  exerciseName: string;
  history: ExerciseHistoryDemo | null;
  onInsertPrevious: () => void;
}

export function HistorySheet({
  open,
  onClose,
  exerciseName,
  history,
  onInsertPrevious,
}: HistorySheetProps): ReactElement | null {
  if (!open) return null;

  return (
    <WorkoutSheetFrame title={`История · ${exerciseName || "—"}`} onClose={onClose}>
      {!history ? (
        <div className="mt-3 text-sm leading-relaxed text-[var(--tg-muted)]">
          <p>Это первое выполнение.</p>
          <p className="mt-2">История появится после тренировки.</p>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-3 text-sm">
          <section>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--tg-muted)]">В прошлый раз</p>
            <p className="mt-1 text-[var(--tg-text)]">{history.previousSummary}</p>
          </section>

          {history.bestSummary ? (
            <section>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--tg-muted)]">Лучший</p>
              <p className="mt-1 text-[var(--tg-text)]">{history.bestSummary}</p>
            </section>
          ) : null}

          <section>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--tg-muted)]">Последние</p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {history.lastThree.map((row) => (
                <li key={`${row.date}-${row.text}`} className="rounded-lg bg-[color:color-mix(in_srgb,var(--tg-bg),transparent_10%)] px-3 py-2 text-xs">
                  <span className="text-[var(--tg-muted)]">{row.date}</span>
                  <span className="text-[var(--tg-text)]"> · {row.text}</span>
                </li>
              ))}
            </ul>
          </section>

          {history.lastComment ? (
            <section>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--tg-muted)]">Комментарий</p>
              <p className="mt-1 text-xs text-[var(--tg-text)]">{history.lastComment}</p>
            </section>
          ) : null}

          {history.lastJournalEntryId ? (
            <Link
              href={`/workouts/${encodeURIComponent(history.lastJournalEntryId)}`}
              prefetch={false}
              className="app-btn block w-full rounded-xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] py-3 text-center text-sm font-semibold text-[var(--text-primary)]"
            >
              Открыть в журнале
            </Link>
          ) : null}

          {history.insertTemplate.length > 0 ? (
            <button
              type="button"
              className="app-btn mt-1 w-full rounded-xl bg-[var(--tg-accent)] py-3 text-center text-sm font-semibold text-white"
              onClick={() => {
                onInsertPrevious();
                onClose();
              }}
            >
              Вставить прошлые значения
            </button>
          ) : null}
          <p className="text-[10px] leading-snug text-[var(--tg-muted)]">
            Подстановка только по кнопке, не автоматически.
          </p>
        </div>
      )}
    </WorkoutSheetFrame>
  );
}
