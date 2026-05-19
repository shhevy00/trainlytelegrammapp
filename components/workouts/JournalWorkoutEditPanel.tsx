"use client";

import { useCallback, useState, type ReactElement } from "react";
import { Card } from "@/components/ui/card";
import { ExerciseCard } from "@/components/workout/ExerciseCard";
import { MoreSheet } from "@/components/workout/MoreSheet";
import { createEmptySetRow } from "@/lib/workout/rows";
import type { WorkoutExercise, WorkoutSetRow, WorkoutSetType } from "@/lib/workout/types";
import { newWorkoutId } from "@/lib/workout/ids";

export interface JournalWorkoutEditDraft {
  title: string;
  durationMin: number;
  workoutComment: string;
  exercises: WorkoutExercise[];
}

interface JournalWorkoutEditPanelProps {
  initial: JournalWorkoutEditDraft;
  errors: string[];
  saving: boolean;
  onCancel: () => void;
  onSave: (draft: JournalWorkoutEditDraft) => void;
}

export function JournalWorkoutEditPanel({
  initial,
  errors,
  saving,
  onCancel,
  onSave,
}: JournalWorkoutEditPanelProps): ReactElement {
  const [draft, setDraft] = useState<JournalWorkoutEditDraft>(() => ({
    title: initial.title,
    durationMin: initial.durationMin,
    workoutComment: initial.workoutComment,
    exercises: structuredClone(initial.exercises),
  }));
  const [moreExerciseId, setMoreExerciseId] = useState<string | null>(null);

  const moreExercise = draft.exercises.find((ex) => ex.id === moreExerciseId) ?? null;

  const patchExercise = useCallback((exerciseId: string, patch: Partial<WorkoutExercise>): void => {
    setDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => (ex.id === exerciseId ? { ...ex, ...patch } : ex)),
    }));
  }, []);

  const patchSet = useCallback((exerciseId: string, setId: string, patch: Partial<WorkoutSetRow>): void => {
    setDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((row) => (row.id === setId ? { ...row, ...patch } : row)),
        };
      }),
    }));
  }, []);

  const deleteSet = useCallback((exerciseId: string, setId: string): void => {
    setDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return { ...ex, sets: ex.sets.filter((row) => row.id !== setId) };
      }),
    }));
  }, []);

  const deleteExercise = useCallback((exerciseId: string): void => {
    setDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((ex) => ex.id !== exerciseId),
    }));
    setMoreExerciseId(null);
  }, []);

  const addExercise = (): void => {
    setDraft((prev) => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        {
          id: newWorkoutId(),
          name: "",
          comment: "",
          skipped: false,
          sets: [createEmptySetRow()],
        },
      ],
    }));
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3 p-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--tg-muted)]">Название</span>
          <input
            value={draft.title}
            onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
            className="min-h-[44px] w-full rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3 py-2 text-[15px] text-[var(--text-primary)] outline-none focus:border-[color:color-mix(in_srgb,var(--brand-solid),transparent_35%)]"
            autoComplete="off"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--tg-muted)]">Длительность, мин</span>
          <input
            type="number"
            min={1}
            inputMode="numeric"
            value={draft.durationMin}
            onChange={(e) => {
              const n = Number.parseInt(e.target.value, 10);
              setDraft((p) => ({ ...p, durationMin: Number.isFinite(n) ? n : p.durationMin }));
            }}
            className="min-h-[44px] w-full rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3 py-2 text-[15px] tabular-nums text-[var(--text-primary)] outline-none focus:border-[color:color-mix(in_srgb,var(--brand-solid),transparent_35%)]"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--tg-muted)]">Комментарий</span>
          <textarea
            rows={3}
            value={draft.workoutComment}
            onChange={(e) => setDraft((p) => ({ ...p, workoutComment: e.target.value }))}
            placeholder="По желанию"
            className="w-full resize-y rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[color:color-mix(in_srgb,var(--brand-solid),transparent_35%)]"
          />
        </label>
      </Card>

      <section className="flex flex-col gap-3">
        {draft.exercises.map((ex, index) => (
          <ExerciseCard
            key={ex.id}
            exerciseIndex={index + 1}
            exercise={ex}
            scrollAnchorId={`journal-edit-ex-${ex.id}`}
            onExercisePatch={(patch) => patchExercise(ex.id, patch)}
            onSetChange={(setId, patch) => patchSet(ex.id, setId, patch)}
            onRequestDeleteSet={(setId) => deleteSet(ex.id, setId)}
            onOpenMore={() => setMoreExerciseId(ex.id)}
          />
        ))}
        <button
          type="button"
          className="app-btn rounded-2xl border border-dashed border-[color:var(--border-strong)] bg-transparent px-4 py-3 text-sm font-semibold text-[var(--text-secondary)]"
          onClick={addExercise}
        >
          + Упражнение
        </button>
      </section>

      {errors.length > 0 ? (
        <ul className="list-inside list-disc space-y-1 text-sm text-[var(--warning)]">
          {errors.map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={saving}
          className="app-btn rounded-2xl bg-[var(--tg-accent)] px-4 py-3 text-white shadow-app-primary disabled:opacity-50"
          onClick={() => onSave(draft)}
        >
          {saving ? "Сохранение…" : "Сохранить изменения"}
        </button>
        <button
          type="button"
          disabled={saving}
          className="app-btn rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-4 py-3 text-[var(--text-primary)] disabled:opacity-50"
          onClick={onCancel}
        >
          Отмена
        </button>
      </div>

      <MoreSheet
        open={moreExercise != null}
        onClose={() => setMoreExerciseId(null)}
        exercise={moreExercise}
        onExercisePatch={(patch) => {
          if (moreExerciseId == null) return;
          patchExercise(moreExerciseId, patch);
        }}
        onOpenHistory={() => setMoreExerciseId(null)}
        onSkipExercise={() => {
          if (moreExerciseId == null) return;
          patchExercise(moreExerciseId, { skipped: true });
          setMoreExerciseId(null);
        }}
        onDeleteExercise={() => {
          if (moreExerciseId == null) return;
          deleteExercise(moreExerciseId);
        }}
        onAddDropSet={() => {
          if (moreExercise == null || moreExerciseId == null) return;
          const parent = [...moreExercise.sets].reverse().find((r) => !r.isDrop);
          if (parent == null) return;
          const drop: WorkoutSetRow = {
            ...createEmptySetRow(),
            isDrop: true,
            parentSetId: parent.id,
            setType: "drop",
          };
          patchExercise(moreExerciseId, { sets: [...moreExercise.sets, drop] });
        }}
        onChangeSetType={(rowId, type: WorkoutSetType) => {
          if (moreExerciseId == null) return;
          patchSet(moreExerciseId, rowId, { setType: type });
        }}
      />
    </div>
  );
}
