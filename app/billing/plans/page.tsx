import type { ReactElement } from "react";
import { BillingPlansContent } from "@/components/billing/BillingPlansContent";
import { getTrainlyDataSource } from "@/lib/config/dataSource";
import { isYookassaBillingConfigured } from "@/lib/config/yookassaBillingAvailability";

export default async function BillingPlansPage(): Promise<ReactElement> {
  let environment: "mock" | "postgres" = "mock";
  try {
    environment = getTrainlyDataSource() === "postgres" ? "postgres" : "mock";
  } catch {
    environment = "mock";
  }

  return (
    <BillingPlansContent
      environment={environment}
      yookassaConfigured={isYookassaBillingConfigured()}
    />
  );
}
