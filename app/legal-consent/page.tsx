import type { ReactElement } from "react";
import { LegalConsentContent } from "@/components/legal/LegalConsentContent";
import { resolveTrainlyDataModeForUi } from "@/lib/config/dataSource";

export default function LegalConsentPage(): ReactElement {
  const trainlyDataMode = resolveTrainlyDataModeForUi();
  return <LegalConsentContent trainlyDataMode={trainlyDataMode} />;
}
