import type { ReactElement } from "react";
import { OverviewDayClosedCard } from "@/components/overview/OverviewDayClosedCard";
import { OverviewEmptyDayActions } from "@/components/overview/OverviewEmptyDayActions";
import { OverviewEmptyScheduleCard } from "@/components/overview/OverviewEmptyScheduleCard";
import { OverviewTodayProgressCard } from "@/components/overview/OverviewTodayProgressCard";
import type { TodayScheduleRollup } from "@/lib/overview/dailyOperations";

interface OverviewEmptyDayContentProps {
  scheduleRollup: TodayScheduleRollup;
}

export function OverviewEmptyDayContent({ scheduleRollup }: OverviewEmptyDayContentProps): ReactElement {
  const dayClosed =
    scheduleRollup.totalTrackedSlots > 0 && scheduleRollup.pendingSlots === 0;
  const calmDayNoSchedule = scheduleRollup.totalTrackedSlots === 0;

  return (
    <div className="overview-empty-day">
      {dayClosed ? (
        <OverviewDayClosedCard scheduleRollup={scheduleRollup} />
      ) : (
        <>
          {!calmDayNoSchedule ? <OverviewTodayProgressCard scheduleRollup={scheduleRollup} /> : null}
          <OverviewEmptyScheduleCard />
        </>
      )}
      <OverviewEmptyDayActions />
    </div>
  );
}
