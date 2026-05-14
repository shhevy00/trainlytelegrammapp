"use client";

import { useState, type ReactElement } from "react";
import type { WorkoutSetRow } from "@/lib/workout/types";

interface SetRowEditorProps {
  row: WorkoutSetRow;
  label: string;
  indent: boolean;
  onChange: (patch: Partial<WorkoutSetRow>) => void;
  /** Удаление строки подхода (подтверждение — на уровне логгера). */
  onRequestDelete: () => void;
}

const inputBase =
  "min-h-[40px] min-w-0 rounded-md border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-1.5 py-1.5 text-sm font-semibold tabular-nums text-[var(--text-primary)] outline-none focus:border-[color:color-mix(in_srgb,var(--brand-solid),transparent_35%)] sm:rounded-lg sm:px-2 sm:py-2 sm:text-[15px]";

export function SetRowEditor({ row, label, indent, onChange, onRequestDelete }: SetRowEditorProps): ReactElement {
  const timeMode = row.setType === "time";
  const hasComment = row.comment.trim().length > 0;
  const [commentOpen, setCommentOpen] = useState(() => row.comment.trim().length > 0);

  const gridTime = "grid w-full min-w-0 grid-cols-[1.125rem_minmax(0,1fr)_2.75rem] items-center gap-0.5 sm:grid-cols-[1.25rem_minmax(0,1fr)_2.85rem] sm:gap-1";
  const gridReps = "grid w-full min-w-0 grid-cols-[1.125rem_minmax(0,1fr)_minmax(0,1fr)_2.75rem] items-center gap-0.5 sm:grid-cols-[1.25rem_minmax(0,1fr)_minmax(0,1fr)_2.85rem] sm:gap-1";

  return (
    <div className={`flex flex-col gap-0.5 ${indent ? "border-l-2 border-[color:var(--border-strong)] pl-2" : ""}`}>
      <div className={timeMode ? gridTime : gridReps}>
        <span className="w-5 shrink-0 text-center font-display text-[10px] font-bold tabular-nums text-[var(--text-muted)] sm:w-6 sm:text-[11px]">
          {label}
        </span>

        {timeMode ? (
          <input
            className={`${inputBase} min-w-0`}
            inputMode="decimal"
            placeholder="сек"
            value={row.durationSec}
            onChange={(e) => onChange({ durationSec: e.target.value })}
            aria-label="Секунды"
          />
        ) : (
          <>
            <input
              className={inputBase}
              inputMode="decimal"
              placeholder="кг"
              value={row.weight}
              onChange={(e) => onChange({ weight: e.target.value })}
              aria-label="Вес"
            />
            <input
              className={inputBase}
              inputMode="numeric"
              placeholder="повт."
              value={row.reps}
              onChange={(e) => onChange({ reps: e.target.value })}
              aria-label="Повторы"
            />
          </>
        )}

        <button
          type="button"
          aria-pressed={row.done}
          aria-label={row.done ? "Подход отмечен" : "Отметить подход"}
          onClick={() => onChange({ done: !row.done })}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border text-base font-bold transition sm:h-12 sm:w-12 ${
            row.done
              ? "border-[var(--tg-accent)] bg-[var(--tg-accent)] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
              : "border-[color:var(--border-strong)] bg-[var(--tg-bg)] text-[var(--tg-muted)]"
          }`}
        >
          ✓
        </button>
      </div>

      <div className="flex min-h-[1rem] items-center justify-end gap-2 pl-1">
        <button
          type="button"
          className="py-0.5 text-[10px] font-medium text-[var(--text-muted)]/80 hover:text-red-400/95"
          aria-label="Удалить подход"
          onClick={onRequestDelete}
        >
          Удалить
        </button>
      </div>

      <div className="flex min-h-[1.125rem] items-center gap-2 pl-[calc(1.5rem+0.375rem)]">
        <button
          type="button"
          className={`shrink-0 text-[11px] font-semibold ${
            commentOpen || hasComment ? "text-[var(--tg-accent)]" : "text-[var(--tg-muted)]"
          }`}
          onClick={() => setCommentOpen((o) => !o)}
        >
          Коммент.
        </button>
        {hasComment && !commentOpen ? (
          <span className="min-w-0 truncate text-xs text-[var(--tg-muted)]">{row.comment.trim()}</span>
        ) : null}
      </div>

      {commentOpen ? (
        <div className="pl-[calc(1.5rem+0.375rem)]">
          <input
            className="w-full rounded-lg border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-2 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[color:color-mix(in_srgb,var(--brand-solid),transparent_35%)]"
            placeholder="Комментарий к подходу"
            value={row.comment}
            onChange={(e) => onChange({ comment: e.target.value })}
            aria-label="Комментарий к подходу"
          />
        </div>
      ) : null}
    </div>
  );
}
