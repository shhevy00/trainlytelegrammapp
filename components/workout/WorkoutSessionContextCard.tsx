"use client";

import type { ReactElement } from "react";
import { DecorativeSvg } from "@/components/ui/DecorativeSvg";
import { clientInitialsFromName, formatWorkoutStartedAt } from "@/lib/workout/liveSessionStats";

interface WorkoutSessionContextCardProps {
  clientName: string;
  title: string;
  startedAtMs: number;
  onTitleChange: (title: string) => void;
}

export function WorkoutSessionContextCard({
  clientName,
  title,
  startedAtMs,
  onTitleChange,
}: WorkoutSessionContextCardProps): ReactElement {
  const initials = clientInitialsFromName(clientName);
  const { dateLabel, timeLabel } = formatWorkoutStartedAt(startedAtMs);

  return (
    <section className="premium-surface shrink-0 p-4">
      <div className="flex items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[color:var(--border-strong)] bg-[var(--bg-card-elevated)] font-display text-sm font-bold text-[var(--text-primary)] shadow-[var(--shadow-elevated)]"
          aria-hidden="true"
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-semibold text-[var(--text-primary)]">{clientName}</p>
          <label className="sr-only" htmlFor="workout-title-input">
            Название тренировки
          </label>
          <input
            id="workout-title-input"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Название тренировки"
            className="mt-1 w-full truncate rounded-lg border border-[color:var(--border-soft)] bg-[var(--bg-card)]/50 px-2 py-1 text-sm font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[color:var(--border-strong)] focus:bg-[var(--bg-card)]"
          />
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1">
              <DecorativeSvg width="14" height="14" viewBox="0 0 24 24" fill="none" className="opacity-70">
                <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </DecorativeSvg>
              {dateLabel}
            </span>
            <span className="inline-flex items-center gap-1">
              <DecorativeSvg width="14" height="14" viewBox="0 0 24 24" fill="none" className="opacity-70">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </DecorativeSvg>
              Начало {timeLabel}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
