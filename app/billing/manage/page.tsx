import { eq } from "drizzle-orm";
import type { ReactElement } from "react";
import { BillingManageContent } from "@/components/billing/BillingManageContent";
import { getTrainerSession } from "@/lib/auth/session";
import { getTrainlyDataSource } from "@/lib/config/dataSource";
import {
  isYookassaBillingConfigured,
  isYookassaWebhookSecretConfigured,
} from "@/lib/config/yookassaBillingAvailability";
import { getDb } from "@/lib/db/server";
import { trainerProductAccess } from "@/db/schema";

export default async function BillingManagePage(): Promise<ReactElement> {
  let environment: "mock" | "postgres" = "mock";
  try {
    environment = getTrainlyDataSource() === "postgres" ? "postgres" : "mock";
  } catch {
    environment = "mock";
  }

  const session = await getTrainerSession();
  let productAccess: { planCode: string | null; validUntilIso: string | null } | null = null;

  if (environment === "postgres" && session != null) {
    const db = getDb();
    const rows = await db
      .select({
        planCode: trainerProductAccess.planCode,
        validUntil: trainerProductAccess.validUntil,
      })
      .from(trainerProductAccess)
      .where(eq(trainerProductAccess.trainerId, session.trainerId))
      .limit(1);
    const row = rows[0];
    if (row != null) {
      productAccess = {
        planCode: row.planCode ?? null,
        validUntilIso: row.validUntil != null ? row.validUntil.toISOString() : null,
      };
    }
  }

  return (
    <BillingManageContent
      environment={environment}
      yookassaConfigured={isYookassaBillingConfigured()}
      yookassaWebhookConfigured={isYookassaWebhookSecretConfigured()}
      productAccess={productAccess}
    />
  );
}
