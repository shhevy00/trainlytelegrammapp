import type { ReactElement } from "react";
import { IconCalendar } from "@/components/overview/overviewIcons";
import type { TodayScheduleRollup } from "@/lib/overview/dailyOperations";
import { formatTodayProgressSplit } from "@/lib/overview/preWorkoutContext";

interface OverviewDayClosedCardProps {
  scheduleRollup: TodayScheduleRollup;
}

export function OverviewDayClosedCard({ scheduleRollup }: OverviewDayClosedCardProps): ReactElement {
  const split = formatTodayProgressSplit(scheduleRollup);
  const percent =
    scheduleRollup.totalTrackedSlots > 0
      ? Math.round((scheduleRollup.completedSlots / scheduleRollup.totalTrackedSlots) * 100)
      : 0;

  return (
    <section className="overview-card overview-day-closed-card shrink-0 min-w-0" aria-label="Итог дня">
      <div className="overview-progress-head">
        <IconCalendar className="overview-progress-icon" aria-hidden />
        <span className="overview-progress-label">Сегодня</span>
        <span className="overview-day-closed-badge">День закрыт</span>
      </div>

      <div
        className="overview-progress-bar-track"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Проведено ${percent}% занятий на сегодня`}
      >
        <span className="overview-progress-bar-fill" style={{ width: `${percent}%` }} />
      </div>

      {split ? (
        <div className="overview-progress-metric">
          <span className="overview-progress-value tabular-nums">{split.completed}</span>
          <span className="overview-progress-suffix tabular-nums">{split.suffix}</span>
        </div>
      ) : null}

      <p className="overview-day-closed-text">
        На сегодня всё проведено. Запланируйте следующие слоты или начните тренировку без записи.
      </p>
    </section>
  );
}
