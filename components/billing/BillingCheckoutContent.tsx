"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent, type ReactElement } from "react";
import { PageHeader } from "@/components/prod-shell/PageHeader";
import { ShellMain } from "@/components/prod-shell/ShellMain";
import { PAID_PLAN_CHECKOUT, parseCheckoutPlanParam } from "@/lib/billing/planDefinitions";
import { createTrainlyYookassaCheckoutAction } from "@/app/actions/billing";
import { useMockApp } from "@/lib/mock/MockAppProvider";

const linkCls = "font-medium text-[var(--brand-solid)] underline underline-offset-2";

export function BillingCheckoutContent({
  checkoutMode = "demo",
}: {
  checkoutMode?: "demo" | "yookassa";
}): ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setMockSubscriptionStatus } = useMockApp();
  /** Примитив в deps: объект searchParams при смене ?plan= на том же маршруте может не триггерить useMemo. */
  const planQuery = searchParams.get("plan");
  const checkoutKind = useMemo(() => parseCheckoutPlanParam(planQuery), [planQuery]);

  const [offer, setOffer] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [payPending, setPayPending] = useState(false);

  useEffect(() => {
    if (checkoutKind === "invalid") {
      router.replace("/billing/plans");
    }
  }, [checkoutKind, router]);

  const planSlug = checkoutKind === "start" || checkoutKind === "pro" || checkoutKind === "max" ? checkoutKind : null;
  const plan = planSlug ? PAID_PLAN_CHECKOUT[planSlug] : null;

  const onPay = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setPayError(null);
    if (!planSlug || !offer) return;
    if (checkoutMode === "yookassa") {
      setPayPending(true);
      try {
        const res = await createTrainlyYookassaCheckoutAction(planSlug);
        if (!res.ok) {
          setPayError(res.error);
          return;
        }
        window.location.assign(res.confirmationUrl);
      } finally {
        setPayPending(false);
      }
      return;
    }
    router.push(`/billing/success?plan=${planSlug}`);
  };

  const onTrialNoPay = async (): Promise<void> => {
    await Promise.resolve(setMockSubscriptionStatus("trial"));
    router.push("/overview");
  };

  if (checkoutKind === "trial") {
    return (
      <ShellMain>
        <PageHeader title="Пробный период" backHref="/billing/plans" backLabel="Назад к тарифам" />
        <div className="premium-surface min-w-0 space-y-3 p-4 text-sm leading-relaxed text-[var(--text-secondary)]">
          <p className="text-[var(--text-primary)]">Пробный период запускается без оплаты.</p>
          <p className="text-[var(--tg-muted)]">
            Оформление доступа через платёжную систему появится позже. Сейчас можно включить пробный режим в демо.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void onTrialNoPay()}
          className="app-btn w-full rounded-2xl bg-[var(--tg-accent)] px-4 py-3.5 text-center text-[15px] font-semibold text-white shadow-app-primary"
        >
          Перейти в обзор
        </button>
        <Link
          href="/billing/plans"
          prefetch={false}
          className="app-btn block w-full rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] py-3 text-center text-sm font-semibold text-[var(--text-primary)]"
        >
          Назад к тарифам
        </Link>
      </ShellMain>
    );
  }

  if (checkoutKind === "invalid" || !plan || !planSlug) {
    return (
      <ShellMain>
        <PageHeader title="Тариф" backHref="/billing/plans" backLabel="Назад к тарифам" />
        <p className="text-sm text-[var(--tg-muted)]">Перенаправление…</p>
      </ShellMain>
    );
  }

  return (
    <ShellMain>
      <PageHeader title="Подтверждение оплаты" backHref="/billing/plans" backLabel="Назад к тарифам" />

      <div className="premium-surface min-w-0 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--tg-muted)]">Тариф</p>
        <p className="mt-1 text-lg font-bold text-[var(--text-primary)]">{plan.name}</p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Период: месяц</p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--text-primary)]">
          {plan.amountRub.toLocaleString("ru-RU")} ₽
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">{plan.summaryLine}</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)] marker:text-[var(--tg-muted)]">
          <li>Безлимит тренировок в рамках тарифа (после запуска сервера)</li>
          <li>Дальнейшие функции — по дорожной карте продукта (без отдельной оплаты за демо-подсказки в v1)</li>
        </ul>
      </div>

      <form onSubmit={(e) => void onPay(e)} className="flex flex-col gap-4">
        <label className="flex gap-3 rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-card)] p-3">
          <input
            type="checkbox"
            checked={offer}
            onChange={(e) => setOffer(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 rounded border-[color:var(--border-strong)]"
          />
          <span className="min-w-0 text-sm leading-relaxed text-[var(--tg-text)]">
            Я принимаю условия оферты (
            <Link href="/legal/offer" prefetch={false} className={linkCls}>
              открыть
            </Link>
            )
          </span>
        </label>

        <p className="text-xs text-[var(--tg-muted)]">
          {checkoutMode === "yookassa"
            ? "Оплата через ЮKassa: после нажатия вы перейдёте на страницу платёжной системы."
            : "Платёжная интеграция будет подключена позже (демо: переход без оплаты)."}
        </p>

        {payError ? (
          <p className="rounded-xl border border-[color:color-mix(in_srgb,var(--danger),transparent_45%)] bg-[color:color-mix(in_srgb,var(--danger),transparent_92%)] px-3 py-2 text-sm text-[var(--danger)]">
            {payError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!offer || payPending}
          className="app-btn w-full rounded-2xl bg-[var(--tg-accent)] px-4 py-3.5 text-center text-[15px] font-semibold text-white shadow-app-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          {payPending ? "Создание платежа…" : checkoutMode === "yookassa" ? "Перейти к оплате в ЮKassa" : "Перейти к оплате"}
        </button>
      </form>

      <Link
        href="/billing/plans"
        prefetch={false}
        className="app-btn block w-full rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] py-3 text-center text-sm font-semibold text-[var(--text-primary)]"
      >
        Назад к тарифам
      </Link>
    </ShellMain>
  );
}
