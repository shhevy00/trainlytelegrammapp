import type { ReactElement } from "react";
import { OverviewDecorImage } from "@/components/overview/OverviewDecorImage";
import { OVERVIEW_DECOR_CALENDAR } from "@/lib/overview/overviewDecorPaths";

export function OverviewEmptyScheduleCard(): ReactElement {
  return (
    <section
      className="overview-card overview-empty-schedule-card relative shrink-0 min-w-0 overflow-hidden"
      aria-label="Сегодня без записей"
    >
      <span className="overview-empty-badge">Сегодня свободно</span>
      <div className="overview-empty-copy">
        <h2 className="overview-empty-title">Нет записей на сегодня</h2>
        <p className="overview-empty-text">
          День открыт для новых слотов в графике или тренировки без записи.
        </p>
      </div>
      <OverviewDecorImage src={OVERVIEW_DECOR_CALENDAR} variant="empty" />
    </section>
  );
}
