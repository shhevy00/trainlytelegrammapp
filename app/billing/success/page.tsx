import type { ReactElement } from "react";
import { BillingSuccessContent } from "@/components/billing/BillingSuccessContent";
import { getTrainlyDataSource } from "@/lib/config/dataSource";

export default function BillingSuccessPage(): ReactElement {
  let allowDemoActivate = false;
  try {
    allowDemoActivate = getTrainlyDataSource() === "mock";
  } catch {
    allowDemoActivate = false;
  }
  return <BillingSuccessContent allowDemoActivate={allowDemoActivate} />;
}
