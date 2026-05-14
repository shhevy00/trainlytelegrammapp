"use client";

import type { ReactElement, ReactNode } from "react";

interface WorkoutSheetFrameProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}

/** Единый стиль нижних шитов логгера: тёмная подложка, скругление сверху. */
export function WorkoutSheetFrame({ title, subtitle, onClose, children }: WorkoutSheetFrameProps): ReactElement {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        aria-label="Закрыть"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="workout-sheet-title"
        className="relative mx-auto max-h-[min(78vh,620px)] w-full max-w-[480px] overflow-y-auto rounded-t-2xl border border-[color:color-mix(in_srgb,var(--border-strong),transparent_40%)] bg-[color:color-mix(in_srgb,var(--bg-card-elevated),#0c0a10_35%)] px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-3 shadow-[0_-12px_40px_rgba(0,0,0,0.45)]"
      >
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-[color:color-mix(in_srgb,var(--border-strong),transparent_20%)]" />
        <h2 id="workout-sheet-title" className="font-display text-base font-semibold tracking-tight text-[var(--text-primary)]">
          {title}
        </h2>
        {subtitle ? <p className="mt-0.5 text-xs leading-snug text-[var(--tg-muted)]">{subtitle}</p> : null}
        {children}
      </div>
    </div>
  );
}
