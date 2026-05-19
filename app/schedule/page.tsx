import type { ReactElement } from "react";
import { SchedulePageContent } from "@/components/schedule/SchedulePageContent";
import { resolveTrainlyDataModeForUi } from "@/lib/config/dataSource";

export default function SchedulePage(): ReactElement {
  const trainlyDataMode = resolveTrainlyDataModeForUi();
  return <SchedulePageContent trainlyDataMode={trainlyDataMode} />;
}
