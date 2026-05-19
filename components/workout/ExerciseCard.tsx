"use client";

import { useRef, type ReactElement } from "react";
import type { WorkoutExercise, WorkoutSetRow } from "@/lib/workout/types";
import { SetRowEditor } from "@/components/workout/SetRowEditor";
import { createEmptySetRow } from "@/lib/workout/rows";
import { setsCountLabel } from "@/lib/workout/setsCountLabel";

interface ExerciseCardProps {
  exerciseIndex: number;
  exercise: WorkoutExercise;
  scrollAnchorId: string;
  onExercisePatch: (patch: Partial<WorkoutExercise>) => void;
  onSetChange: (setId: string, patch: Partial<WorkoutSetRow>) => void;
  onRequestDeleteSet: (setId: string) => void;
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
  exerciseIndex,
  exercise,
  scrollAnchorId,
  onExercisePatch,
  onSetChange,
  onRequestDeleteSet,
  onOpenMore,
}: ExerciseCardProps): ReactElement {
  const scrollEndRef = useRef<HTMLDivElement>(null);

  const scrollCardEndIntoView = (): void => {
    requestAnimationFrame(() => {
      scrollEndRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
    });
  };

  if (exercise.skipped) {
    return (
      <article
        id={scrollAnchorId}
        className="premium-surface scroll-mt-24 p-4 opacity-80"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-semibold text-[var(--text-muted)]">
              {exerciseIndex}. {exercise.name || "Упражнение"}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Пропущено</p>
          </div>
          <button
            type="button"
            className="app-btn-secondary shrink-0 px-3 py-1.5 text-xs"
            onClick={() => onExercisePatch({ skipped: false })}
          >
            Вернуть
          </button>
        </div>
      </article>
    );
  }

  const setCount = exercise.sets.length;

  return (
    <article id={scrollAnchorId} className="premium-surface scroll-mt-24 p-4">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[color:var(--border-soft)] bg-[var(--bg-card-elevated)] font-display text-[11px] font-bold tabular-nums text-[var(--text-muted)]">
              {exerciseIndex}
            </span>
            <input
              value={exercise.name}
              onChange={(e) => onExercisePatch({ name: e.target.value })}
              placeholder="Название упражнения"
              aria-label="Название упражнения"
              className="min-w-0 flex-1 rounded-lg border border-[color:var(--border-soft)] bg-[var(--bg-card)] px-2 py-1.5 text-[15px] font-semibold text-[var(--text-primary)] outline-none placeholder:font-normal placeholder:text-[var(--text-muted)] focus:border-[color:var(--border-strong)]"
            />
            <span className="shrink-0 rounded-full border border-[color:var(--border-soft)] bg-[var(--bg-card-elevated)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
              {setsCountLabel(setCount)}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[color:var(--border-soft)] bg-[var(--bg-card)] text-lg leading-none text-[var(--text-secondary)] transition hover:border-[color:var(--border-strong)] active:scale-[0.98]"
          aria-label="Действия с упражнением"
          onClick={onOpenMore}
        >
          ⋮
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {exercise.sets.map((row, idx) => {
          const prev = exercise.sets[idx - 1];
          const showRowHeader = idx === 0 || (prev != null && prev.setType !== row.setType);
          return (
            <SetRowEditor
              key={row.id}
              row={row}
              label={labelForRow(exercise.sets, row)}
              indent={row.isDrop}
              showTableHeader={showRowHeader}
              onChange={(patch) => onSetChange(row.id, patch)}
              onRequestDelete={() => onRequestDeleteSet(row.id)}
            />
          );
        })}
      </div>

      <button
        type="button"
        className="app-btn mt-3 w-full rounded-xl border border-dashed border-[color:var(--border-strong)] bg-transparent py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[color:var(--border-strong)] hover:bg-[var(--bg-card)]/50"
        onClick={() => {
          onExercisePatch({ sets: [...exercise.sets, createEmptySetRow()] });
          scrollCardEndIntoView();
        }}
      >
        + Добавить подход
      </button>
      <div ref={scrollEndRef} className="h-px w-full scroll-mt-32" aria-hidden />
    </article>
  );
}
