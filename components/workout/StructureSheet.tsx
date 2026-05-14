"use client";

import { useState, type ReactElement } from "react";
import { WorkoutSheetFrame } from "@/components/workout/WorkoutSheetFrame";
import { countFilledSetsInExercise } from "@/lib/workout/calculations";
import type { WorkoutExercise } from "@/lib/workout/types";

interface StructureSheetProps {
  open: boolean;
  onClose: () => void;
  exercises: WorkoutExercise[];
  onJumpToExercise: (anchorId: string) => void;
  onAddExercise: (name: string) => void;
  onRenameExercise: (id: string, name: string) => void;
  onRequestDeleteExercise: (id: string) => void;
}

export function StructureSheet({
  open,
  onClose,
  exercises,
  onJumpToExercise,
  onAddExercise,
  onRenameExercise,
  onRequestDeleteExercise,
}: StructureSheetProps): ReactElement | null {
  const [newName, setNewName] = useState("");
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  if (!open) return null;

  const submitAdd = (): void => {
    const t = newName.trim();
    if (!t) return;
    onAddExercise(t);
    setNewName("");
  };

  const beginRename = (ex: WorkoutExercise): void => {
    setRenameId(ex.id);
    setRenameDraft(ex.name);
  };

  const saveRename = (): void => {
    if (!renameId) return;
    onRenameExercise(renameId, renameDraft.trim());
    setRenameId(null);
    setRenameDraft("");
  };

  return (
    <WorkoutSheetFrame title="Структура тренировки" subtitle="Список, добавление и переименование" onClose={onClose}>
      <ul className="mt-3 flex max-h-[45vh] flex-col gap-2 overflow-y-auto overscroll-contain pr-0.5">
        {exercises.map((ex, i) => {
          const filled = countFilledSetsInExercise(ex);
          const anchor = `ex-${ex.id}`;
          const status = ex.skipped ? "Пропущено" : filled > 0 ? `${filled} подх.` : "Не начато";
          const isRenaming = renameId === ex.id;

          return (
            <li key={ex.id}>
              <div className="flex flex-col gap-2 rounded-xl border border-[color:var(--border-soft)] bg-[color:color-mix(in_srgb,var(--tg-bg),transparent_15%)] p-3">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 w-6 shrink-0 text-center text-xs font-bold tabular-nums text-[var(--tg-muted)]">
                    {i + 1}.
                  </span>
                  <div className="min-w-0 flex-1">
                    {isRenaming ? (
                      <input
                        value={renameDraft}
                        onChange={(e) => setRenameDraft(e.target.value)}
                        className="w-full min-h-[44px] rounded-lg border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-2 py-2 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[color:color-mix(in_srgb,var(--brand-solid),transparent_35%)]"
                        placeholder="Название упражнения"
                        aria-label="Новое название упражнения"
                      />
                    ) : (
                      <>
                        <p className="break-words text-sm font-semibold leading-snug text-[var(--text-primary)]">
                          {ex.name.trim() || "Без названия"}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--tg-muted)]">{status}</p>
                      </>
                    )}
                  </div>
                </div>

                {isRenaming ? (
                  <div className="flex flex-wrap gap-2 pl-8">
                    <button
                      type="button"
                      className="app-btn min-h-[44px] flex-1 rounded-xl bg-[var(--tg-accent)] px-3 py-2 text-sm font-semibold text-white"
                      onClick={saveRename}
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      className="app-btn min-h-[44px] flex-1 rounded-xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)]"
                      onClick={() => {
                        setRenameId(null);
                        setRenameDraft("");
                      }}
                    >
                      Отмена
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 pl-8">
                    <button
                      type="button"
                      className="app-btn min-h-[44px] flex-1 rounded-lg border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-2 py-2 text-xs font-semibold text-[var(--text-primary)]"
                      onClick={() => {
                        onJumpToExercise(anchor);
                        onClose();
                      }}
                    >
                      К карточке
                    </button>
                    <button
                      type="button"
                      className="app-btn min-h-[44px] flex-1 rounded-lg border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-2 py-2 text-xs font-semibold text-[var(--text-primary)]"
                      onClick={() => beginRename(ex)}
                    >
                      Переименовать
                    </button>
                    <button
                      type="button"
                      className="app-btn min-h-[44px] flex-1 rounded-lg border border-red-500/35 bg-red-500/10 px-2 py-2 text-xs font-semibold text-red-300"
                      onClick={() => onRequestDeleteExercise(ex.id)}
                    >
                      Удалить
                    </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-col gap-2 border-t border-[color:var(--border-soft)] pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--tg-muted)]">Добавить упражнение</p>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Название"
          className="min-h-[44px] w-full rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[color:color-mix(in_srgb,var(--brand-solid),transparent_35%)]"
        />
        <button
          type="button"
          className="app-btn min-h-[44px] w-full rounded-xl bg-[var(--tg-accent)] py-3 text-sm font-semibold text-white"
          onClick={submitAdd}
        >
          Добавить
        </button>
      </div>
    </WorkoutSheetFrame>
  );
}
