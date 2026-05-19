"use client";

import type { ReactElement } from "react";
import {
  REST_TIMER_OPTIONS,
  type RestTimerSec,
  writeRestTimerPreference,
} from "@/lib/workout/restTimerPreference";

interface WorkoutRestTimerRowProps {
  value: RestTimerSec;
  countdownSec: number | null;
  onChange: (sec: RestTimerSec) => void;
}

export function WorkoutRestTimerRow({
  value,
  countdownSec,
  onChange,
}: WorkoutRestTimerRowProps): ReactElement {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Отдых между подходами
        </span>
        {countdownSec != null && countdownSec > 0 ? (
          <span className="text-xs font-bold tabular-nums text-[var(--brand-solid)]">{countdownSec} с</span>
        ) : null}
      </div>
      <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="Длительность отдыха">
        {REST_TIMER_OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={active}
              className={`min-h-[36px] rounded-lg border px-1 text-[11px] font-semibold tabular-nums transition ${
                active
                  ? "border-[color:color-mix(in_srgb,var(--brand-solid),transparent_40%)] bg-[color:color-mix(in_srgb,var(--brand-solid),transparent_88%)] text-[var(--text-primary)]"
                  : "border-[color:var(--border-soft)] bg-[var(--bg-card)]/80 text-[var(--text-muted)]"
              }`}
              onClick={() => {
                writeRestTimerPreference(opt.value);
                onChange(opt.value);
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
