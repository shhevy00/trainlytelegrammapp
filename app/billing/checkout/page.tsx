import { Suspense, type ReactElement } from "react";
import { BillingCheckoutContent } from "@/components/billing/BillingCheckoutContent";
import { ShellMain } from "@/components/prod-shell/ShellMain";
import { getTrainlyDataSource } from "@/lib/config/dataSource";
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
  const yookassaConfigured =
    process.env.YOOKASSA_SHOP_ID != null &&
    process.env.YOOKASSA_SHOP_ID.length > 0 &&
    process.env.YOOKASSA_SECRET_KEY != null &&
    process.env.YOOKASSA_SECRET_KEY.length > 0;
  const checkoutMode =
    dataSource === "postgres" && session != null && yookassaConfigured ? "yookassa" : "demo";

  return (
    <Suspense fallback={<CheckoutFallback />}>
      <BillingCheckoutContent checkoutMode={checkoutMode} />
    </Suspense>
  );
}
