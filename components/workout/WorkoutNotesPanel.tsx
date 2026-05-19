"use client";

import type { ReactElement } from "react";

interface WorkoutNotesPanelProps {
  workoutComment: string;
  dirty: boolean;
  onWorkoutCommentChange: (value: string) => void;
}

export function WorkoutNotesPanel({
  workoutComment,
  dirty,
  onWorkoutCommentChange,
}: WorkoutNotesPanelProps): ReactElement {
  return (
    <div className="flex flex-col gap-3">
      <section className="premium-surface p-4">
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]" htmlFor="session-comment-tab">
          Комментарий к тренировке
        </label>
        <textarea
          id="session-comment-tab"
          rows={workoutComment.trim().length > 0 ? 5 : 4}
          placeholder="Заметки по сессии, самочувствие клиента…"
          value={workoutComment}
          onChange={(e) => onWorkoutCommentChange(e.target.value)}
          className="mt-2 w-full resize-none rounded-xl border border-[color:var(--border-soft)] bg-[var(--bg-card)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[color:var(--border-strong)]"
        />
      </section>

      {dirty ? (
        <p className="text-[11px] leading-snug text-[var(--text-muted)]">
          Изменения сохраняются автоматически (черновик в облаке или sessionStorage в mock).
        </p>
      ) : null}
    </div>
  );
}
