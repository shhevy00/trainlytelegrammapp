"use client";

import { useState, type ReactElement } from "react";
import { WorkoutSheetFrame } from "@/components/workout/WorkoutSheetFrame";
import { countFilledSetsInExercise } from "@/lib/workout/calculations";
import type { WorkoutExercise, WorkoutSetRow, WorkoutSetType } from "@/lib/workout/types";

interface MoreSheetProps {
  open: boolean;
  onClose: () => void;
  exercise: WorkoutExercise | null;
  onExercisePatch: (patch: Partial<WorkoutExercise>) => void;
  onOpenHistory: () => void;
  onSkipExercise: () => void;
  onDeleteExercise: () => void;
  onAddDropSet: () => void;
  onChangeSetType: (rowId: string, type: WorkoutSetType) => void;
  onOpenReplace?: () => void;
}

const SET_TYPE_LABELS: Record<WorkoutSetType, string> = {
  working: "Рабочий",
  warmup: "Разминка",
  drop: "Дроп",
  failure: "Отказ",
  amrap: "AMRAP",
  time: "Время",
};

type Step = "menu" | "pickRow" | "pickType" | "delete_confirm";

function rowMenuLabel(rows: WorkoutSetRow[], row: WorkoutSetRow): string {
  if (row.isDrop) return "Дроп";
  let n = 0;
  for (const r of rows) {
    if (!r.isDrop) n += 1;
    if (r.id === row.id) break;
  }
  return `Подход ${n}`;
}

export function MoreSheet({
  open,
  onClose,
  exercise,
  onExercisePatch,
  onOpenHistory,
  onSkipExercise,
  onDeleteExercise,
  onAddDropSet,
  onChangeSetType,
  onOpenReplace,
}: MoreSheetProps): ReactElement | null {
  const [step, setStep] = useState<Step>("menu");
  const [rowForType, setRowForType] = useState<string | null>(null);

  if (!open || !exercise) return null;

  const resetAndClose = (): void => {
    setStep("menu");
    setRowForType(null);
    onClose();
  };

  const backToMenu = (): void => {
    setStep("menu");
    setRowForType(null);
  };

  return (
    <WorkoutSheetFrame title={`Ещё · ${exercise.name || "Упражнение"}`} onClose={resetAndClose}>
      {step === "menu" ? (
        <div className="mt-3 flex flex-col gap-2">
          <div className="rounded-xl border border-[color:var(--border-soft)] bg-[color:color-mix(in_srgb,var(--tg-bg),transparent_10%)] px-3 py-2.5">
            <label className="text-xs font-medium text-[var(--tg-muted)]" htmlFor="more-exercise-comment">
              Комментарий к упражнению
            </label>
            <textarea
              id="more-exercise-comment"
              rows={2}
              value={exercise.comment}
              placeholder="По желанию"
              onChange={(e) => onExercisePatch({ comment: e.target.value })}
              className="mt-1.5 w-full resize-none rounded-lg border border-[color:var(--border-soft)] bg-[var(--tg-card)] px-2 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[color:color-mix(in_srgb,var(--brand-solid),transparent_35%)]"
            />
          </div>

          <button
            type="button"
            className="rounded-xl border border-[color:var(--border-soft)] bg-[var(--bg-card-elevated)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-primary)]"
            onClick={() => {
              onOpenHistory();
              resetAndClose();
            }}
          >
            История упражнения
          </button>

          {onOpenReplace ? (
            <button
              type="button"
              className="rounded-xl border border-[color:var(--border-soft)] bg-[var(--bg-card-elevated)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-primary)]"
              onClick={() => {
                onOpenReplace();
                resetAndClose();
              }}
            >
              Заменить упражнение
            </button>
          ) : null}

          <button
            type="button"
            className="rounded-xl border border-[color:var(--border-soft)] bg-[var(--bg-card-elevated)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-primary)]"
            onClick={() => setStep("pickRow")}
          >
            Сменить тип подхода
          </button>

          <button
            type="button"
            className="rounded-xl border border-[color:var(--border-soft)] bg-[color:color-mix(in_srgb,var(--tg-bg),transparent_10%)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-primary)]"
            onClick={() => {
              onAddDropSet();
              resetAndClose();
            }}
          >
            Добавить дроп-сет
          </button>

          <button
            type="button"
            className="rounded-xl border border-[color:var(--border-soft)] bg-[color:color-mix(in_srgb,var(--tg-bg),transparent_10%)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-primary)]"
            onClick={() => {
              onSkipExercise();
              resetAndClose();
            }}
          >
            Пропустить упражнение
          </button>

          <button
            type="button"
            className="rounded-xl border border-red-500/35 bg-red-500/15 px-3 py-2.5 text-left text-sm font-semibold text-red-300"
            onClick={() => {
              if (countFilledSetsInExercise(exercise) === 0) {
                onDeleteExercise();
                resetAndClose();
                return;
              }
              setStep("delete_confirm");
            }}
          >
            Удалить упражнение
          </button>
        </div>
      ) : null}

      {step === "delete_confirm" ? (
        <div className="mt-4 flex flex-col gap-3">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Удалить упражнение?</h3>
          <p className="text-sm text-[var(--tg-muted)]">
            {countFilledSetsInExercise(exercise) > 0
              ? "Заполненные подходы тоже удалятся."
              : "Будут удалены все строки подходов."}
          </p>
          <button
            type="button"
            className="app-btn rounded-xl bg-red-600 py-3 text-center text-sm font-bold text-white"
            onClick={() => {
              onDeleteExercise();
              resetAndClose();
            }}
          >
            Удалить
          </button>
          <button
            type="button"
            className="rounded-xl border border-[color:var(--border-soft)] bg-[color:color-mix(in_srgb,var(--tg-bg),transparent_10%)] px-3 py-2.5 text-sm font-semibold text-[var(--text-primary)]"
            onClick={backToMenu}
          >
            Отмена
          </button>
        </div>
      ) : null}

      {step === "pickRow" ? (
        <div className="mt-3 flex flex-col gap-2">
          <button type="button" className="text-left text-xs font-semibold text-[var(--tg-accent)]" onClick={backToMenu}>
            ← Назад
          </button>
          <p className="text-xs text-[var(--tg-muted)]">Выберите подход</p>
          {exercise.sets.map((row) => (
            <button
              key={row.id}
              type="button"
              className="rounded-xl border border-[color:var(--border-soft)] bg-[color:color-mix(in_srgb,var(--tg-bg),transparent_10%)] px-3 py-2.5 text-left text-sm font-medium"
              onClick={() => {
                setRowForType(row.id);
                setStep("pickType");
              }}
            >
              {rowMenuLabel(exercise.sets, row)}
            </button>
          ))}
        </div>
      ) : null}

      {step === "pickType" && rowForType ? (
        <div className="mt-3 flex flex-col gap-2">
          <button type="button" className="text-left text-xs font-semibold text-[var(--tg-accent)]" onClick={() => setStep("pickRow")}>
            ← Назад
          </button>
          <p className="text-xs text-[var(--tg-muted)]">Тип подхода</p>
          {(Object.keys(SET_TYPE_LABELS) as WorkoutSetType[]).map((t) => (
            <button
              key={t}
              type="button"
              className="rounded-xl border border-[color:var(--border-soft)] bg-[color:color-mix(in_srgb,var(--tg-bg),transparent_10%)] px-3 py-2.5 text-left text-sm font-medium"
              onClick={() => {
                onChangeSetType(rowForType, t);
                resetAndClose();
              }}
            >
              {SET_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      ) : null}
    </WorkoutSheetFrame>
  );
}
