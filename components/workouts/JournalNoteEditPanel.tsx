"use client";

import { useState, type ReactElement } from "react";
import { Card } from "@/components/ui/card";
import type { JournalNoteUpdateInput } from "@/lib/journal/validateJournalUpdate";

interface JournalNoteEditPanelProps {
  initial: JournalNoteUpdateInput;
  errors: string[];
  saving: boolean;
  onCancel: () => void;
  onSave: (draft: JournalNoteUpdateInput) => void;
}

export function JournalNoteEditPanel({
  initial,
  errors,
  saving,
  onCancel,
  onSave,
}: JournalNoteEditPanelProps): ReactElement {
  const [draft, setDraft] = useState<JournalNoteUpdateInput>(initial);

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
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--tg-muted)]">Заметка</span>
          <textarea
            rows={4}
            value={draft.workoutComment}
            onChange={(e) => setDraft((p) => ({ ...p, workoutComment: e.target.value }))}
            placeholder="Текст заметки"
            className="w-full resize-y rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[color:color-mix(in_srgb,var(--brand-solid),transparent_35%)]"
          />
        </label>
      </Card>

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
          {saving ? "Сохранение…" : "Сохранить"}
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
    </div>
  );
}
