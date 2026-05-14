"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, type ReactElement } from "react";
import { PlanIconMax, PlanIconPro, PlanIconStart, PlanIconTrial, PricingPlanCard } from "@/components/billing/PricingPlanCard";
import { ShellMain } from "@/components/prod-shell/ShellMain";
import { TRIAL_PLAN_PUBLIC } from "@/lib/billing/planDefinitions";
import { useMockApp } from "@/lib/mock/MockAppProvider";

function TrustChips(): ReactElement {
  const chip =
    "inline-flex max-w-full items-center gap-1.5 rounded-full border border-[color:var(--border-violet-soft)] bg-[color:color-mix(in_srgb,var(--tg-bg),transparent_42%)] px-2.5 py-1 text-[11px] font-medium leading-tight text-[var(--text-secondary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-md sm:px-3 sm:text-xs";

  return (
    <div className="flex min-w-0 flex-wrap gap-2">
      <span className={chip}>
        <span className="text-[var(--brand-solid)]" aria-hidden>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="shrink-0">
            <path
              d="M21 12a9 9 0 11-3-6.7M21 3v6h-6"
              stroke="currentColor"
              strokeWidth="1.35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        Отмена в любой момент
      </span>
    </div>
  );
}

export function BillingPlansContent(): ReactElement {
  const router = useRouter();
  const { setMockSubscriptionStatus } = useMockApp();

  const onStartTrial = useCallback(async (): Promise<void> => {
    await Promise.resolve(setMockSubscriptionStatus("trial"));
    router.push("/overview");
  }, [router, setMockSubscriptionStatus]);

  return (
    <ShellMain>
      <header className="flex min-w-0 flex-col gap-2.5">
        <Link
          href="/profile"
          prefetch={false}
          className="inline-flex min-h-[44px] max-w-full items-center text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <span aria-hidden className="mr-1.5 shrink-0">
            ←
          </span>
          <span className="min-w-0 truncate">Назад</span>
        </Link>
        <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-[var(--text-primary)] sm:text-[1.65rem]">
          Выберите доступ к{" "}
          <span className="bg-brand-gradient bg-clip-text text-transparent">Trainly</span>
        </h1>
        <div className="flex max-w-full flex-col gap-1 text-[14px] leading-snug text-[var(--text-secondary)] sm:text-[15px]">
          <p className="min-w-0">Тариф под размер вашей базы клиентов.</p>
          <p className="min-w-0 text-[var(--tg-muted)]">
            Клиенты, тренировки, график, оплаты и AI-подготовки в одном дневнике.
          </p>
        </div>
        <TrustChips />
      </header>

      <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
        <PricingPlanCard
          variant="secondary"
          icon={<PlanIconTrial />}
          title={TRIAL_PLAN_PUBLIC.name}
          priceLine={`${TRIAL_PLAN_PUBLIC.priceLine} · ${TRIAL_PLAN_PUBLIC.periodLabel}`}
          helperLine={TRIAL_PLAN_PUBLIC.helperLine}
          features={[...TRIAL_PLAN_PUBLIC.features]}
          ctaLabel="Начать бесплатно"
          ctaOnClick={() => void onStartTrial()}
        />
        <PricingPlanCard
          variant="hero"
          icon={<PlanIconPro />}
          title="Pro"
          badgeLabel="Лучший выбор"
          priceLine="1 190 ₽ / мес"
          helperLine="Оптимально для большинства тренеров"
          features={[
            "60 активных клиентов",
            "150 AI-подготовок / мес",
            "Безлимит шаблонов",
            "История упражнений",
            "Заметки и ограничения",
          ]}
          ctaLabel="Выбрать Pro"
          ctaHref="/billing/checkout?plan=pro"
        />
        <PricingPlanCard
          variant="secondary"
          icon={<PlanIconStart />}
          title="Start"
          priceLine="690 ₽ / мес"
          helperLine="Для небольшой базы клиентов"
          features={[
            "15 активных клиентов",
            "30 AI-подготовок / мес",
            "Безлимит тренировок",
            "График",
            "Шаблоны",
            "Оплаты и долги клиентов",
          ]}
          ctaLabel="Выбрать Start"
          ctaHref="/billing/checkout?plan=start"
        />
        <PricingPlanCard
          variant="secondary"
          icon={<PlanIconMax />}
          title="Max"
          priceLine="2 490 ₽ / мес"
          helperLine="Для большой базы клиентов"
          features={[
            "150 активных клиентов",
            "500 AI-подготовок / мес",
            "Приоритетная поддержка позже",
            "Экспорт позже",
          ]}
          ctaLabel="Выбрать Max"
          ctaHref="/billing/checkout?plan=max"
        />
      </div>

      <nav
        aria-label="Правовая информация"
        className="flex min-w-0 flex-wrap items-center justify-center gap-x-5 gap-y-2.5 px-1 py-1 text-center text-[13px] sm:text-sm"
      >
        <Link
          href="/legal/offer"
          prefetch={false}
          className="min-w-0 text-[var(--text-secondary)] underline decoration-[color:color-mix(in_srgb,var(--border-soft),transparent_30%)] decoration-2 underline-offset-[0.28em] transition hover:text-[var(--text-primary)] hover:decoration-[color:color-mix(in_srgb,var(--brand-solid),transparent_35%)]"
        >
          Оферта
        </Link>
        <Link
          href="/legal/tariffs"
          prefetch={false}
          className="min-w-0 text-[var(--text-secondary)] underline decoration-[color:color-mix(in_srgb,var(--border-soft),transparent_30%)] decoration-2 underline-offset-[0.28em] transition hover:text-[var(--text-primary)] hover:decoration-[color:color-mix(in_srgb,var(--brand-solid),transparent_35%)]"
        >
          Тарифы
        </Link>
        <Link
          href="/legal/refund"
          prefetch={false}
          className="min-w-0 text-[var(--text-secondary)] underline decoration-[color:color-mix(in_srgb,var(--border-soft),transparent_30%)] decoration-2 underline-offset-[0.28em] transition hover:text-[var(--text-primary)] hover:decoration-[color:color-mix(in_srgb,var(--brand-solid),transparent_35%)]"
        >
          Оплата и возврат
        </Link>
      </nav>
    </ShellMain>
  );
}
