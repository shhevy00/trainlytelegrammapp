"use client";

import type { ReactElement } from "react";
import { Card } from "@/components/ui/card";
import type { WorkoutExercise, WorkoutSetRow } from "@/lib/workout/types";
import { SetRowEditor } from "@/components/workout/SetRowEditor";
import { createEmptySetRow } from "@/lib/workout/rows";

interface ExerciseCardProps {
  exercise: WorkoutExercise;
  previousText: string;
  bestText: string | null;
  scrollAnchorId: string;
  onExercisePatch: (patch: Partial<WorkoutExercise>) => void;
  onSetChange: (setId: string, patch: Partial<WorkoutSetRow>) => void;
  onRequestDeleteSet: (setId: string) => void;
  onOpenHistory: () => void;
  onOpenMore: () => void;
}

function labelForRow(rows: WorkoutSetRow[], row: WorkoutSetRow): string {
  if (row.isDrop) return "↳";
  let n = 0;
  for (const r of rows) {
    if (!r.isDrop) n += 1;
    if (r.id === row.id) break;
  }
  return String(n);
}

export function ExerciseCard({
  exercise,
  previousText,
  bestText,
  scrollAnchorId,
  onExercisePatch,
  onSetChange,
  onRequestDeleteSet,
  onOpenHistory,
  onOpenMore,
}: ExerciseCardProps): ReactElement {
  if (exercise.skipped) {
    return (
      <Card
        id={scrollAnchorId}
        className="border-dashed border-[color:var(--border-strong)] bg-[color:color-mix(in_srgb,var(--bg-card-elevated),transparent_35%)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-semibold text-[var(--text-muted)]">{exercise.name}</p>
            <p className="mt-1 text-xs text-[var(--tg-muted)]">Пропущено</p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-lg border border-[color:var(--border-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)]"
            onClick={() => onExercisePatch({ skipped: false })}
          >
            Вернуть
          </button>
        </div>
      </Card>
    );
  }

  const prevShort = previousText.trim();
  const bestShort = bestText?.trim() ?? "";
  const needsName = !exercise.name.trim();
  const hasExComment = exercise.comment.trim().length > 0;

  return (
    <Card id={scrollAnchorId} className="border border-[color:var(--border-soft)] shadow-sm">
      <div className="flex flex-col gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          {needsName ? (
            <input
              value={exercise.name}
              onChange={(e) => onExercisePatch({ name: e.target.value })}
              placeholder="Название упражнения"
              aria-label="Название упражнения"
              className="min-h-0 w-full rounded-lg border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-2 py-1.5 text-[15px] font-semibold leading-snug text-[var(--text-primary)] outline-none focus:border-[color:color-mix(in_srgb,var(--brand-solid),transparent_35%)]"
            />
          ) : (
            <h2 className="truncate font-display text-[16px] font-semibold leading-snug text-[var(--text-primary)] sm:text-[17px]">
              {exercise.name.trim()}
            </h2>
          )}
          <p className="text-[11px] leading-snug text-[var(--tg-muted)]">
            {prevShort ? (
              <>
                <span className="text-[var(--text-muted)]">Было:</span> {prevShort}
                {bestShort ? (
                  <span className="text-[var(--text-muted)]">
                    {" "}
                    · <span className="text-[var(--tg-muted)]">Лучшее:</span> {bestShort}
                  </span>
                ) : null}
              </>
            ) : (
              <span>Первый раз</span>
            )}
          </p>
          {hasExComment ? (
            <p className="line-clamp-2 text-[11px] leading-snug text-[var(--text-secondary)]">
              <span className="font-medium text-[var(--tg-muted)]">Коммент. </span>
              {exercise.comment.trim()}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          {exercise.sets.map((row) => (
            <div
              key={row.id}
              className={`rounded-lg p-0.5 transition-colors sm:rounded-xl sm:p-1 ${
                row.done ? "bg-[color:color-mix(in_srgb,var(--tg-accent),transparent_92%)]" : ""
              }`}
            >
              <SetRowEditor
                row={row}
                label={labelForRow(exercise.sets, row)}
                indent={row.isDrop}
                onChange={(patch) => onSetChange(row.id, patch)}
                onRequestDelete={() => onRequestDeleteSet(row.id)}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          className="app-btn w-full rounded-xl border border-[color:color-mix(in_srgb,var(--tg-accent),transparent_40%)] bg-[color:color-mix(in_srgb,var(--tg-accent),transparent_92%)] py-2.5 text-sm font-bold text-[var(--tg-accent)] shadow-sm"
          onClick={() => {
            onExercisePatch({ sets: [...exercise.sets, createEmptySetRow()] });
          }}
        >
          + Подход
        </button>

        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-t border-[color:var(--border-soft)] pt-1.5">
          <button
            type="button"
            className="text-[11px] font-semibold text-[var(--tg-muted)] underline-offset-2 hover:text-[var(--text-secondary)]"
            onClick={onOpenHistory}
          >
            История
          </button>
          <button
            type="button"
            className="text-[11px] font-semibold text-[var(--tg-muted)] underline-offset-2 hover:text-[var(--text-secondary)]"
            onClick={onOpenMore}
          >
            Ещё
          </button>
        </div>
      </div>
    </Card>
  );
}
