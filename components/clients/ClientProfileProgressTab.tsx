"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import type { ProfilePeriodKey, ProfileProgressDashboard } from "@/lib/clients/profileProgress";
import { formatLastWorkoutRelative } from "@/lib/clients/profileProgress";
import { formatJournalTime } from "@/lib/mock/journalSeed";
import type { CoachQuickNote } from "@/lib/mock/coachLedger";
import type { MockClient } from "@/lib/mock/data";
import type { JournalCompletedWorkout } from "@/lib/types";

const PERIOD_OPTIONS: { id: ProfilePeriodKey; label: string }[] = [
  { id: "7", label: "7 дн." },
  { id: "30", label: "30 дн." },
  { id: "90", label: "90 дн." },
  { id: "all", label: "Всё" },
];

interface ClientProfileProgressTabProps {
  client: MockClient;
  dashboard: ProfileProgressDashboard;
  period: ProfilePeriodKey;
  onPeriodChange: (p: ProfilePeriodKey) => void;
  journalWorkoutCount: number;
  latestJournalWorkout: JournalCompletedWorkout | null;
  todayIso: string;
  startHref: string;
  progressQuickNotes: readonly CoachQuickNote[];
  onOpenPayments: () => void;
}

export function ClientProfileProgressTab({
  client,
  dashboard,
  period,
  onPeriodChange,
  journalWorkoutCount,
  latestJournalWorkout,
  todayIso,
  startHref,
  progressQuickNotes,
  onOpenPayments,
}: ClientProfileProgressTabProps): ReactElement {
  const maxWeek = Math.max(1, ...dashboard.weekBars.map((w) => w.count));
  const maxVol = Math.max(1, ...dashboard.volumeBars.map((v) => v.volumeKg));
  const periodLabel =
    period === "7" ? "7 дней" : period === "30" ? "30 дней" : period === "90" ? "90 дней" : "всё время";

  const periodPicker = (
    <div className="client-profile-periods" role="group" aria-label="Период">
      {PERIOD_OPTIONS.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onPeriodChange(p.id)}
          className={["client-profile-period", period === p.id ? "client-profile-period--active" : ""]
            .filter(Boolean)
            .join(" ")}
        >
          {p.label}
        </button>
      ))}
    </div>
  );

  if (journalWorkoutCount === 0) {
    return (
      <div className="client-profile-panel">
        <div className="client-profile-empty">
          <p className="client-profile-empty__title">Пока нет тренировок</p>
          <p className="client-profile-empty__text">После 2–3 занятий здесь появится динамика.</p>
        </div>
        <Link href={startHref} prefetch={false} className="app-btn client-profile-hero__btn-primary">
          Начать тренировку
        </Link>
      </div>
    );
  }

  if (journalWorkoutCount <= 2) {
    return (
      <div className="client-profile-panel">
        {periodPicker}
        <div className="client-profile-empty">
          <p className="client-profile-empty__title">Пока мало данных</p>
          <p className="client-profile-empty__text">Проведите ещё несколько тренировок, чтобы увидеть графики.</p>
          <p className="client-profile-empty__meta">
            В журнале: <strong>{journalWorkoutCount}</strong>
            {latestJournalWorkout
              ? ` · последняя ${formatLastWorkoutRelative(latestJournalWorkout.createdAtMs, todayIso)}`
              : ""}
          </p>
          {(client.remainingSessions <= 2 || client.remainingSessions < 0) && (
            <p className="client-profile-empty__meta">
              Оплаченных занятий: <strong>{client.remainingSessions}</strong> —{" "}
              <button type="button" className="client-profile-link-btn" onClick={onOpenPayments}>
                вкладка «Оплата»
              </button>
            </p>
          )}
        </div>
      </div>
    );
  }

  const workoutWord = (n: number): string => {
    if (n === 1) return "тренировка";
    if (n >= 2 && n <= 4) return "тренировки";
    return "тренировок";
  };

  return (
    <div className="client-profile-panel">
      {periodPicker}
      <p className="client-profile-panel__lead">
        За {periodLabel}: <strong>{dashboard.workoutsInPeriod}</strong> {workoutWord(dashboard.workoutsInPeriod)}
      </p>

      <div className="client-profile-kpis">
        <div className="client-profile-kpi">
          <span className="client-profile-kpi__label">Тренировок</span>
          <span className="client-profile-kpi__value">{dashboard.workoutsInPeriod}</span>
        </div>
        <div className="client-profile-kpi">
          <span className="client-profile-kpi__label">В неделю</span>
          <span className="client-profile-kpi__value">{dashboard.workoutsPerWeek}</span>
        </div>
        <div className="client-profile-kpi">
          <span className="client-profile-kpi__label">Последняя</span>
          <span className="client-profile-kpi__value client-profile-kpi__value--sm">
            {dashboard.lastWorkoutRelative ?? "—"}
          </span>
        </div>
      </div>

      {!dashboard.showCharts ? (
        <p className="client-profile-panel__hint">Мало данных для графика в этом периоде — смените период или проведите ещё занятия.</p>
      ) : (
        <>
          <div className="client-profile-chart">
            <p className="client-profile-chart__title">По неделям</p>
            <div className="client-profile-chart__bars">
              {dashboard.weekBars.map((w) => (
                <div key={w.key} className="client-profile-chart__col">
                  <div
                    className="client-profile-chart__bar client-profile-chart__bar--accent"
                    style={{ height: `${4 + (w.count / maxWeek) * 52}px` }}
                    title={`${w.label}: ${w.count}`}
                  />
                  <span className="client-profile-chart__axis">{w.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="client-profile-chart">
            <p className="client-profile-chart__title">Упражнение</p>
            {dashboard.exerciseTrend ? (
              <>
                <p className="client-profile-chart__ex-name">{dashboard.exerciseTrend.name}</p>
                <p className="client-profile-chart__ex-meta">{dashboard.exerciseTrend.lastLabel}</p>
                <div className="client-profile-chart__mini">
                  {dashboard.exerciseTrend.normalizedSeries.map((h, i) => (
                    <div
                      key={`ex-${i}`}
                      className="client-profile-chart__mini-bar"
                      style={{ height: `${4 + h * 44}px`, opacity: 0.35 + h * 0.65 }}
                    />
                  ))}
                </div>
              </>
            ) : (
              <p className="client-profile-panel__hint">Нужно 2–3 тренировки с одним упражнением для тренда.</p>
            )}
          </div>

          <div className="client-profile-chart">
            <p className="client-profile-chart__title">Объём, кг</p>
            {dashboard.hasVolumeInPeriod ? (
              <div className="client-profile-chart__bars">
                {dashboard.volumeBars.map((v) => (
                  <div key={v.key} className="client-profile-chart__col">
                    <div
                      className="client-profile-chart__bar client-profile-chart__bar--volume"
                      style={{ height: `${4 + (v.volumeKg / maxVol) * 48}px` }}
                      title={`${v.label}: ${v.volumeKg} кг`}
                    />
                    <span className="client-profile-chart__axis">{v.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="client-profile-panel__hint">Добавьте вес и повторения в подходах.</p>
            )}
          </div>
        </>
      )}

      {progressQuickNotes.length > 0 ? (
        <div className="client-profile-notes">
          <p className="client-profile-notes__title">Заметки о прогрессе</p>
          <ul className="client-profile-notes__list">
            {progressQuickNotes.map((n) => (
              <li key={n.id} className="client-profile-notes__item">
                <span className="client-profile-notes__when">
                  {formatLastWorkoutRelative(n.createdAtMs, todayIso)} · {formatJournalTime(n.createdAtMs)}
                </span>
                <p>{n.text.trim()}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
