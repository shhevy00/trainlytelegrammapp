import type { ReactElement } from "react";
import { IconCheckStat, IconDebtStat, IconUpcomingStat } from "@/components/overview/overviewIcons";
import type { TodayScheduleRollup } from "@/lib/overview/dailyOperations";

interface OverviewDayStatsRowProps {
  scheduleRollup: TodayScheduleRollup;
  aheadCount: number;
  clientsWithDebt: number;
}

type StatTone = "completed" | "upcoming" | "debt";

function debtLabel(n: number): string {
  if (n === 1) return "долг";
  if (n >= 2 && n <= 4) return "долга";
  return "долгов";
}

export function OverviewDayStatsRow({
  scheduleRollup,
  aheadCount,
  clientsWithDebt,
}: OverviewDayStatsRowProps): ReactElement {
  return (
    <section className="overview-stat-card" aria-label="Сводка дня">
      <div className="overview-stat-row">
        <StatCell
          tone="completed"
          icon={<IconCheckStat />}
          value={scheduleRollup.completedSlots}
          label="проведено"
        />
        <StatCell tone="upcoming" icon={<IconUpcomingStat />} value={aheadCount} label="впереди" />
        <StatCell
          tone="debt"
          icon={<IconDebtStat />}
          value={clientsWithDebt}
          label={debtLabel(clientsWithDebt)}
        />
      </div>
    </section>
  );
}

function StatCell({
  tone,
  icon,
  value,
  label,
}: {
  tone: StatTone;
  icon: ReactElement;
  value: number;
  label: string;
}): ReactElement {
  return (
    <div className="overview-stat-cell">
      <span className={`overview-stat-icon overview-stat-icon--${tone}`}>{icon}</span>
      <div className="overview-stat-metric">
        <span className="overview-stat-value">{value}</span>
        <span className="overview-stat-label">{label}</span>
      </div>
    </div>
  );
}
