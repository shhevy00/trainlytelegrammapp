"use client";

import { useMemo, useState, type ReactElement } from "react";
import { WorkoutSheetFrame } from "@/components/workout/WorkoutSheetFrame";
import { filterExerciseNameSuggestions } from "@/lib/workout/recentExerciseNames";

interface ReplaceExerciseSheetProps {
  open: boolean;
  currentName: string;
  suggestions: readonly string[];
  onClose: () => void;
  onSelect: (name: string) => void;
}

export function ReplaceExerciseSheet({
  open,
  currentName,
  suggestions,
  onClose,
  onSelect,
}: ReplaceExerciseSheetProps): ReactElement | null {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => filterExerciseNameSuggestions(suggestions, query), [suggestions, query]);

  if (!open) return null;

  const apply = (name: string): void => {
    const t = name.trim();
    if (t.length === 0) return;
    onSelect(t);
    setQuery("");
    onClose();
  };

  return (
    <WorkoutSheetFrame title="Заменить упражнение" subtitle={currentName.trim() || "Без названия"} onClose={onClose}>
      <p className="mt-2 text-xs leading-relaxed text-[var(--tg-muted)]">
        Выберите из недавних по этому клиенту или введите новое название.
      </p>
      <label className="mt-3 block text-xs font-medium text-[var(--text-muted)]" htmlFor="replace-exercise-search">
        Поиск
      </label>
      <input
        id="replace-exercise-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Название упражнения"
        className="mt-1.5 w-full min-h-[44px] rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[color:color-mix(in_srgb,var(--brand-solid),transparent_35%)]"
      />

      <ul className="mt-3 flex max-h-[40vh] flex-col gap-1.5 overflow-y-auto overscroll-contain">
        {filtered.length === 0 ? (
          <li className="rounded-xl border border-dashed border-[color:var(--border-strong)] px-3 py-4 text-center text-sm text-[var(--tg-muted)]">
            {suggestions.length === 0 ? "В журнале пока нет упражнений для подсказок." : "Ничего не найдено."}
          </li>
        ) : (
          filtered.map((name) => (
            <li key={name}>
              <button
                type="button"
                className="w-full rounded-xl border border-[color:var(--border-soft)] bg-[var(--bg-card-elevated)] px-3 py-2.5 text-left text-sm font-medium text-[var(--text-primary)]"
                onClick={() => apply(name)}
              >
                {name}
              </button>
            </li>
          ))
        )}
      </ul>

      {query.trim().length > 0 &&
      !filtered.some((n) => n.toLowerCase() === query.trim().toLowerCase()) ? (
        <button
          type="button"
          className="trainly-cta-primary app-btn mt-3 w-full min-h-[48px] px-4 py-3 text-sm font-bold"
          onClick={() => apply(query)}
        >
          Использовать «{query.trim()}»
        </button>
      ) : null}
    </WorkoutSheetFrame>
  );
}
