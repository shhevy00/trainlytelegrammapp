import { Suspense, type ReactElement } from "react";
import { BillingCheckoutContent } from "@/components/billing/BillingCheckoutContent";
import { ShellMain } from "@/components/prod-shell/ShellMain";
import { getTrainlyDataSource } from "@/lib/config/dataSource";
import { isYookassaBillingConfigured } from "@/lib/config/yookassaBillingAvailability";
import { getTrainerSession } from "@/lib/auth/session";

function CheckoutFallback(): ReactElement {
  return (
    <ShellMain>
      <div className="animate-pulse rounded-2xl bg-[var(--tg-card)] p-6 text-sm text-[var(--tg-muted)]">
        Загрузка…
      </div>
    </ShellMain>
  );
}

export default async function BillingCheckoutPage(): Promise<ReactElement> {
  const dataSource = getTrainlyDataSource();
  const session = await getTrainerSession();
  const yookassaConfigured = isYookassaBillingConfigured();
  const checkoutMode =
    dataSource === "postgres" && session != null && yookassaConfigured ? "yookassa" : "demo";

  return (
    <Suspense fallback={<CheckoutFallback />}>
      <BillingCheckoutContent checkoutMode={checkoutMode} />
    </Suspense>
  );
}
