"use client";

import type { ReactElement } from "react";
import { WorkoutRestTimerRow } from "@/components/workout/WorkoutRestTimerRow";
import type { RestTimerSec } from "@/lib/workout/restTimerPreference";

interface WorkoutStickyFooterProps {
  hideBottomNav: boolean;
  finishPending: boolean;
  restTimerSec: RestTimerSec;
  restCountdownSec: number | null;
  onRestTimerChange: (sec: RestTimerSec) => void;
  onOpenStructure: () => void;
  onAddExercise: () => void;
  onFinish: () => void;
}

function IconStructure(): ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 opacity-80">
      <path
        d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconPlus(): ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 opacity-80">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconCheck(): ReactElement {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ToolbarButton({
  label,
  icon,
  onClick,
  ariaLabel,
}: {
  label: string;
  icon: ReactElement;
  onClick: () => void;
  ariaLabel?: string;
}): ReactElement {
  return (
    <button
      type="button"
      aria-label={ariaLabel ?? label}
      onClick={onClick}
      className="app-btn flex min-h-[48px] flex-1 flex-col items-center justify-center gap-1 rounded-[var(--radius-card)] border border-[color:var(--border-soft)] bg-[var(--bg-card)]/90 px-2 py-2 text-[var(--text-secondary)] transition active:scale-[0.98] hover:border-[color:var(--border-strong)] hover:text-[var(--text-primary)]"
    >
      {icon}
      <span className="text-[11px] font-semibold leading-none">{label}</span>
    </button>
  );
}

export function WorkoutStickyFooter({
  hideBottomNav,
  finishPending,
  restTimerSec,
  restCountdownSec,
  onRestTimerChange,
  onOpenStructure,
  onAddExercise,
  onFinish,
}: WorkoutStickyFooterProps): ReactElement {
  const bottomClass = hideBottomNav
    ? "bottom-0 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]"
    : "bottom-[calc(5.5rem+max(0.35rem,env(safe-area-inset-bottom,0px)))]";

  return (
    <div
      className={`workout-footer-v2 fixed inset-x-0 z-40 flex justify-center ${bottomClass}`}
      data-workout-footer="v2"
    >
      <div className="flex w-full max-w-[min(100%,480px)] flex-col gap-2 rounded-t-[var(--radius-sheet)] border border-b-0 border-[color:var(--border-soft)] bg-[color:color-mix(in_srgb,var(--bg-sheet),transparent_2%)] px-3 pb-3 pt-3 shadow-[var(--shadow-nav)] backdrop-blur-xl supports-[backdrop-filter]:bg-[color:color-mix(in_srgb,var(--bg-sheet),transparent_14%)]">
        <WorkoutRestTimerRow
          value={restTimerSec}
          countdownSec={restCountdownSec}
          onChange={onRestTimerChange}
        />
        <div className="grid grid-cols-2 gap-2">
          <ToolbarButton label="Структура" icon={<IconStructure />} onClick={onOpenStructure} />
          <ToolbarButton label="Упражнение" icon={<IconPlus />} onClick={onAddExercise} ariaLabel="Добавить упражнение" />
        </div>

        <button
          type="button"
          className="trainly-cta-primary app-btn flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[var(--radius-card)] px-4 text-[15px] font-bold tracking-tight shadow-app-primary transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55"
          disabled={finishPending}
          onClick={onFinish}
        >
          <IconCheck />
          <span>{finishPending ? "Сохранение…" : "Завершить тренировку"}</span>
        </button>
      </div>
    </div>
  );
}
