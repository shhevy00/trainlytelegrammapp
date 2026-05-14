import type { ReactElement } from "react";
import { TrainerProfileContent } from "@/components/profile/TrainerProfileContent";
import { resolveTrainlyDataModeForUi } from "@/lib/config/dataSource";
import { isYookassaBillingConfigured } from "@/lib/config/yookassaBillingAvailability";

export default function ProfilePage(): ReactElement {
  const trainlyDataMode = resolveTrainlyDataModeForUi();
  const yookassaBillingConfigured = isYookassaBillingConfigured();
  return (
    <TrainerProfileContent
      trainlyDataMode={trainlyDataMode}
      yookassaBillingConfigured={yookassaBillingConfigured}
    />
  );
}
