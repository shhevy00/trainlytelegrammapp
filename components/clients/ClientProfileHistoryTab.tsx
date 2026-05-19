"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { formatLastWorkoutRelative } from "@/lib/clients/profileProgress";
import { formatJournalTime } from "@/lib/mock/journalSeed";
import type { JournalEntry } from "@/lib/types";

interface ClientProfileHistoryTabProps {
  entries: readonly JournalEntry[];
  todayIso: string;
  startHref: string;
  quickNoteHref: string;
}

export function ClientProfileHistoryTab({
  entries,
  todayIso,
  startHref,
  quickNoteHref,
}: ClientProfileHistoryTabProps): ReactElement {
  if (entries.length === 0) {
    return (
      <div className="client-profile-panel">
        <div className="client-profile-empty">
          <p className="client-profile-empty__title">Записей пока нет</p>
          <p className="client-profile-empty__text">Тренировки и заметки появятся здесь после первого занятия.</p>
        </div>
        <Link href={startHref} prefetch={false} className="app-btn client-profile-hero__btn-primary">
          Первая тренировка
        </Link>
        <Link href={quickNoteHref} prefetch={false} className="app-btn client-profile-hero__btn-secondary">
          Быстрая заметка
        </Link>
      </div>
    );
  }

  return (
    <ul className="client-profile-history">
      {entries.map((e) => {
        const isWorkout = e.kind === "workout";
        const when = `${formatLastWorkoutRelative(e.createdAtMs, todayIso)} · ${formatJournalTime(e.createdAtMs)}`;
        return (
          <li key={e.id}>
            <Link
              href={`/workouts/${e.id}`}
              prefetch={false}
              className={[
                "client-profile-history__item",
                isWorkout ? "client-profile-history__item--workout" : "client-profile-history__item--note",
              ].join(" ")}
            >
              <span className="client-profile-history__title">{e.title}</span>
              <span className="client-profile-history__badge">{isWorkout ? "Тренировка" : "Заметка"}</span>
              <span className="client-profile-history__when">{when}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
