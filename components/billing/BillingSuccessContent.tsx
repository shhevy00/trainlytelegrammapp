"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, type ReactElement } from "react";
import { PageHeader } from "@/components/prod-shell/PageHeader";
import { ShellMain } from "@/components/prod-shell/ShellMain";
import { useMockApp } from "@/lib/mock/MockAppProvider";
import {
  formatPlanRub,
  getPaidPlanCheckoutQuote,
  parseBillingPeriodParam,
  parseCheckoutPlanParam,
  parsePaidPlanSlugStrict,
} from "@/lib/billing/planDefinitions";

function BillingSuccessInner({ allowDemoActivate }: { allowDemoActivate: boolean }): ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setMockSubscriptionStatus } = useMockApp();
  const planQuery = searchParams.get("plan");
  const periodQuery = searchParams.get("period");
  const orderId = searchParams.get("orderId");
  const planSlug = useMemo(() => parsePaidPlanSlugStrict(planQuery), [planQuery]);
  const billingPeriod = useMemo(() => parseBillingPeriodParam(periodQuery), [periodQuery]);
  const quote = useMemo(
    () => (planSlug != null ? getPaidPlanCheckoutQuote(planSlug, billingPeriod) : null),
    [planSlug, billingPeriod],
  );

  useEffect(() => {
    const k = parseCheckoutPlanParam(planQuery);
    if (k === "free" || k === "invalid" || planSlug == null) {
      router.replace("/billing/plans");
    }
  }, [planQuery, planSlug, router]);

  const onActivate = async (): Promise<void> => {
    await Promise.resolve(setMockSubscriptionStatus("active"));
    router.push("/overview");
  };

  if (!quote || !planSlug) {
    return (
      <ShellMain>
        <p className="text-sm text-[var(--tg-muted)]">Перенаправление…</p>
      </ShellMain>
    );
  }

  const hasOrder = orderId != null && orderId.length > 0;

  return (
    <ShellMain>
      <PageHeader title="Оплата прошла" backHref="/billing/manage" backLabel="Подписка" />

      <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
        {hasOrder
          ? "Платёж отправлен в ЮKassa. Статус подписки обновится автоматически после обработки уведомления (обычно несколько секунд). Если в профиле статус не сменился — откройте «Подписка» позже или обратитесь в поддержку."
          : "Доступ будет активирован после подключения платёжной системы. В демо можно продолжить работу."}
      </p>

      <div className="premium-surface min-w-0 space-y-1 p-3 text-xs text-[var(--tg-muted)]">
        <p>
          Выбранный план{hasOrder ? "" : " (демо)"}:{" "}
          <span className="font-semibold text-[var(--text-primary)]">{quote.name}</span>
        </p>
        <p>
          Период:{" "}
          <span className="font-semibold text-[var(--text-primary)]">
            {quote.billingPeriod === "year" ? "год (оплата раз в год)" : "месяц"}
          </span>
        </p>
        <p>
          Сумма: <span className="font-semibold text-[var(--text-primary)]">{formatPlanRub(quote.amountRub)}</span>
        </p>
      </div>

      {allowDemoActivate && !hasOrder ? (
        <button
          type="button"
          onClick={() => void onActivate()}
          className="app-btn inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl bg-[var(--tg-accent)] px-4 py-3.5 text-center text-[15px] font-semibold text-white shadow-app-primary"
        >
          Активировать демо-доступ
        </button>
      ) : null}

      <Link
        href="/overview"
        prefetch={false}
        className="app-btn inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-4 py-3 text-center text-sm font-semibold text-[var(--text-primary)]"
      >
        Перейти в обзор
      </Link>
    </ShellMain>
  );
}

function SuccessFallback(): ReactElement {
  return (
    <ShellMain>
      <div className="animate-pulse rounded-2xl bg-[var(--tg-card)] p-6 text-sm text-[var(--tg-muted)]">Загрузка…</div>
    </ShellMain>
  );
}

export function BillingSuccessContent({
  allowDemoActivate = false,
}: {
  allowDemoActivate?: boolean;
}): ReactElement {
  return (
    <Suspense fallback={<SuccessFallback />}>
      <BillingSuccessInner allowDemoActivate={allowDemoActivate} />
    </Suspense>
  );
}
