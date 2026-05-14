import type { ReactElement } from "react";
import { OverviewPageContent } from "@/components/overview/OverviewPageContent";
import { resolveTrainlyDataModeForUi } from "@/lib/config/dataSource";

export default function OverviewPage(): ReactElement {
  const trainlyDataMode = resolveTrainlyDataModeForUi();
  return <OverviewPageContent trainlyDataMode={trainlyDataMode} />;
}
