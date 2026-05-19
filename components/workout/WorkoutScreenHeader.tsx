"use client";

import type { ReactElement } from "react";

interface WorkoutScreenHeaderProps {
  onBack: () => void;
}

export function WorkoutScreenHeader({ onBack }: WorkoutScreenHeaderProps): ReactElement {
  return (
    <header className="workout-screen-header flex shrink-0 items-center gap-2 border-b border-[color:var(--border-soft)] pb-2.5">
      <button
        type="button"
        onClick={onBack}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[color:var(--border-soft)] bg-[var(--bg-card-elevated)] text-[var(--text-primary)] transition active:scale-[0.98]"
        aria-label="Назад"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M15 6l-6 6 6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <h1 className="min-w-0 flex-1 text-center font-display text-base font-semibold tracking-tight text-[var(--text-primary)]">
        Тренировка
      </h1>
      <span className="w-10 shrink-0" aria-hidden />
    </header>
  );
}
