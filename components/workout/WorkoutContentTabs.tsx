"use client";

import type { ReactElement, ReactNode } from "react";

export type WorkoutContentTabId = "exercises" | "notes";

interface WorkoutContentTabsProps {
  activeTab: WorkoutContentTabId;
  exerciseCount: number;
  onTabChange: (tab: WorkoutContentTabId) => void;
  exercisesPanel: ReactNode;
  notesPanel: ReactNode;
}

const tabs: { id: WorkoutContentTabId; label: string; panelId: string }[] = [
  { id: "exercises", label: "Упражнения", panelId: "workout-tab-exercises" },
  { id: "notes", label: "Заметки", panelId: "workout-tab-notes" },
];

export function WorkoutContentTabs({
  activeTab,
  exerciseCount,
  onTabChange,
  exercisesPanel,
  notesPanel,
}: WorkoutContentTabsProps): ReactElement {
  return (
    <div className="flex flex-col gap-3">
      <div
        className="flex shrink-0 rounded-[var(--radius-card)] border border-[color:var(--border-soft)] bg-[var(--bg-card)]/60 p-0.5"
        role="tablist"
        aria-label="Разделы тренировки"
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={tab.panelId}
              className={`app-btn min-h-[44px] flex-1 rounded-[calc(var(--radius-card)-2px)] px-3 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-[var(--bg-card-elevated)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
              onClick={() => onTabChange(tab.id)}
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                {tab.label}
                {tab.id === "exercises" && exerciseCount > 0 ? (
                  <span className="rounded-full bg-[color:color-mix(in_srgb,var(--brand-solid),transparent_82%)] px-1.5 py-px text-[10px] font-bold tabular-nums text-[var(--text-primary)]">
                    {exerciseCount}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
      <div
        id={activeTab === "exercises" ? "workout-tab-exercises" : "workout-tab-notes"}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeTab === "exercises" ? exercisesPanel : notesPanel}
      </div>
    </div>
  );
}
