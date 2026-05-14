import { Suspense, type ReactElement } from "react";
import { AddPaymentFlow } from "@/components/add-payment/AddPaymentFlow";

function AddPaymentFallback(): ReactElement {
  return (
    <div className="mx-auto w-full max-w-[480px] px-4 py-8 text-sm text-[var(--tg-muted)]">Загрузка…</div>
  );
}

export default function AddPaymentPage(): ReactElement {
  return (
    <Suspense fallback={<AddPaymentFallback />}>
      <AddPaymentFlow />
    </Suspense>
  );
}
