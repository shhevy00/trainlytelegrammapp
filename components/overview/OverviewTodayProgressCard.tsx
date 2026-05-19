import type { ReactElement } from "react";
import { IconCalendar } from "@/components/overview/overviewIcons";
import type { TodayScheduleRollup } from "@/lib/overview/dailyOperations";
import { formatTodayProgressSplit } from "@/lib/overview/preWorkoutContext";

interface OverviewTodayProgressCardProps {
  scheduleRollup: TodayScheduleRollup;
}

export function OverviewTodayProgressCard({ scheduleRollup }: OverviewTodayProgressCardProps): ReactElement {
  const todayProgressSplit = formatTodayProgressSplit(scheduleRollup);
  const calmDayNoSchedule = scheduleRollup.totalTrackedSlots === 0;
  const percent =
    scheduleRollup.totalTrackedSlots > 0
      ? Math.round((scheduleRollup.completedSlots / scheduleRollup.totalTrackedSlots) * 100)
      : 0;

  return (
    <section className="overview-card overview-progress-card shrink-0 min-w-0" aria-label="Прогресс за сегодня">
      <div className="overview-progress-head">
        <IconCalendar className="overview-progress-icon" aria-hidden />
        <span className="overview-progress-label">Сегодня</span>
      </div>

      {todayProgressSplit ? (
        <>
          <div
            className="overview-progress-bar-track"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span className="overview-progress-bar-fill" style={{ width: `${percent}%` }} />
          </div>
          <div className="overview-progress-metric">
            <span className="overview-progress-value tabular-nums">{todayProgressSplit.completed}</span>
            <span className="overview-progress-suffix tabular-nums">{todayProgressSplit.suffix}</span>
          </div>
        </>
      ) : (
        <p className="overview-progress-empty">
          {calmDayNoSchedule
            ? "В графике пока нет активных записей на сегодня."
            : "Прогресс за сегодня недоступен."}
        </p>
      )}
    </section>
  );
}
