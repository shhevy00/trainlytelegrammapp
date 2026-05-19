import type { ReactElement } from "react";
import { JournalPageContent } from "@/components/journal/JournalPageContent";
import { resolveTrainlyDataModeForUi } from "@/lib/config/dataSource";

export default function JournalPage(): ReactElement {
  const trainlyDataMode = resolveTrainlyDataModeForUi();
  return <JournalPageContent trainlyDataMode={trainlyDataMode} />;
}
