"use client";

import { useState, type ReactElement } from "react";
import type { WorkoutSetRow } from "@/lib/workout/types";

interface SetRowEditorProps {
  row: WorkoutSetRow;
  label: string;
  indent: boolean;
  showTableHeader?: boolean;
  onChange: (patch: Partial<WorkoutSetRow>) => void;
  onRequestDelete: () => void;
}

const inputBase =
  "min-h-[40px] min-w-0 w-full rounded-md border border-[color:var(--border-soft)] bg-[var(--bg-card)] px-1.5 py-1.5 text-center text-sm font-semibold tabular-nums text-[var(--text-primary)] outline-none focus:border-[color:var(--border-strong)] sm:min-h-[42px] sm:px-2 sm:text-[15px]";

const colSet = "w-[2.25rem] shrink-0 sm:w-10";
const colDone = "w-[2.75rem] shrink-0 sm:w-11";

export function SetRowEditor({
  row,
  label,
  indent,
  showTableHeader = false,
  onChange,
  onRequestDelete,
}: SetRowEditorProps): ReactElement {
  const timeMode = row.setType === "time";
  const hasComment = row.comment.trim().length > 0;
  const [commentOpen, setCommentOpen] = useState(() => row.comment.trim().length > 0);

  const headerRow = showTableHeader ? (
    <div
      className={`mb-1 grid items-center gap-1 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] sm:gap-1.5 ${
        timeMode ? "grid-cols-[2.25rem_1fr_2.75rem] sm:grid-cols-[2.5rem_1fr_2.75rem]" : "grid-cols-[2.25rem_1fr_1fr_2.75rem] sm:grid-cols-[2.5rem_1fr_1fr_2.75rem]"
      }`}
      aria-hidden
    >
      <span className={colSet}>№</span>
      <span>{timeMode ? "Сек" : "Вес"}</span>
      {!timeMode ? <span>Повт</span> : null}
      <span className="text-center">✓</span>
    </div>
  ) : null;

  return (
    <div className={`flex flex-col gap-1 ${indent ? "border-l-2 border-[color:var(--border-strong)] pl-2" : ""}`}>
      {headerRow}
      <div
        className={`grid items-center gap-1 sm:gap-1.5 ${
          timeMode
            ? "grid-cols-[2.25rem_1fr_2.75rem] sm:grid-cols-[2.5rem_1fr_2.75rem]"
            : "grid-cols-[2.25rem_1fr_1fr_2.75rem] sm:grid-cols-[2.5rem_1fr_1fr_2.75rem]"
        } ${row.done ? "rounded-lg bg-[color:color-mix(in_srgb,var(--success),transparent_92%)] px-0.5 py-0.5" : ""}`}
      >
        <span
          className={`${colSet} text-center font-display text-[11px] font-bold tabular-nums text-[var(--text-muted)] sm:text-xs`}
        >
          {label}
        </span>

        {timeMode ? (
          <input
            className={inputBase}
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
              placeholder="повт"
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
          className={`${colDone} flex h-10 items-center justify-center rounded-lg border text-base font-bold transition sm:h-11 ${
            row.done
              ? "border-[color:color-mix(in_srgb,var(--success),transparent_25%)] bg-[var(--success)] text-white"
              : "border-[color:var(--border-strong)] bg-[var(--bg-card)] text-[var(--text-muted)]"
          }`}
        >
          ✓
        </button>
      </div>

      <div className="flex min-h-[1rem] items-center justify-between gap-2 pl-1 pr-0.5">
        <button
          type="button"
          className={`shrink-0 text-[11px] font-semibold ${
            commentOpen || hasComment ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]"
          }`}
          onClick={() => setCommentOpen((o) => !o)}
        >
          Коммент.
        </button>
        <button
          type="button"
          className="py-0.5 text-[10px] font-medium text-[var(--text-muted)] hover:text-red-400/95"
          aria-label="Удалить подход"
          onClick={onRequestDelete}
        >
          Удалить
        </button>
      </div>

      {commentOpen ? (
        <input
          className="w-full rounded-lg border border-[color:var(--border-soft)] bg-[var(--bg-card)] px-2 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[color:var(--border-strong)]"
          placeholder="Комментарий к подходу"
          value={row.comment}
          onChange={(e) => onChange({ comment: e.target.value })}
          aria-label="Комментарий к подходу"
        />
      ) : null}
    </div>
  );
}
