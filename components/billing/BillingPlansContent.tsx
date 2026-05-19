"use client";

import Link from "next/link";
import { useMemo, useState, type ReactElement } from "react";
import { BillingPeriodToggle } from "@/components/billing/BillingPeriodToggle";
import {
  PlanIconExpert,
  PlanIconPro,
  PlanIconStart,
  PlanIconStudio,
  PricingPlanCard,
} from "@/components/billing/PricingPlanCard";
import { ShellMain } from "@/components/prod-shell/ShellMain";
import {
  BILLING_PLAN_CATALOG,
  buildCheckoutHref,
  getPlanPriceUi,
  type BillingPeriod,
  type BillingPlanCatalogEntry,
} from "@/lib/billing/planDefinitions";

const VALUE_PROPS: { title: string; text: string }[] = [
  { title: "Один дневник", text: "Клиенты, график, журнал и оплаты" },
  { title: "Меньше хаоса", text: "Вместо заметок в мессенджерах" },
  { title: "Растёте вместе", text: "Смените тариф, когда база вырастет" },
];

function planIcon(entry: BillingPlanCatalogEntry): ReactElement {
  switch (entry.id) {
    case "start":
      return <PlanIconStart />;
    case "pro":
      return <PlanIconPro />;
    case "expert":
      return <PlanIconExpert />;
    case "studio":
      return <PlanIconStudio />;
    default:
      return <PlanIconPro />;
  }
}

function PlanCardFromEntry({
  plan,
  featured,
  billingPeriod,
}: {
  plan: BillingPlanCatalogEntry;
  featured?: boolean;
  billingPeriod: BillingPeriod;
}): ReactElement {
  const ctaHref =
    plan.ctaHref ?? (plan.paidSlug != null ? buildCheckoutHref(plan.paidSlug, billingPeriod) : undefined);

  const rawPriceUi = plan.paidSlug != null ? getPlanPriceUi(plan.paidSlug, billingPeriod) : undefined;
  const priceUi = rawPriceUi != null ? { ...rawPriceUi, altLine: null } : undefined;

  return (
    <PricingPlanCard
      planId={plan.id}
      featured={featured}
      variant={plan.variant}
      showcase
      icon={planIcon(plan)}
      title={plan.name}
      priceLine={plan.paidSlug == null ? plan.priceLine : undefined}
      priceUi={priceUi}
      limitLine={plan.limitLine}
      tagline={plan.tagline}
      description={plan.description || undefined}
      featuresIntro={plan.featuresIntro}
      badgeLabel={plan.badgeLabel}
      features={plan.features}
      ctaLabel={plan.ctaLabel}
      ctaHref={ctaHref}
    />
  );
}

export interface BillingPlansContentProps {
  environment: "mock" | "postgres";
  yookassaConfigured: boolean;
}

export function BillingPlansContent({ environment, yookassaConfigured }: BillingPlansContentProps): ReactElement {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("month");

  const { featuredPlan, otherPlans } = useMemo(() => {
    const pro = BILLING_PLAN_CATALOG.find((p) => p.id === "pro");
    const rest = BILLING_PLAN_CATALOG.filter((p) => p.id !== "pro");
    return { featuredPlan: pro, otherPlans: rest };
  }, []);

  return (
    <ShellMain className="billing-plans-shell">
      <div className="billing-plans-page">
        <header className="billing-plans-hero">
          <div className="billing-plans-hero-glow" aria-hidden />
          <Link href="/profile" prefetch={false} className="billing-plans-back">
            <span aria-hidden>←</span>
            <span>Назад</span>
          </Link>
          <p className="billing-plans-eyebrow">Тарифы Trainly</p>
          <h1 className="billing-plans-title">
            Дневник тренера,
            <span className="billing-plans-title-accent"> который окупается</span>
          </h1>
          <p className="billing-plans-lead">
            Полный продукт на любом платном тарифе — выберите масштаб базы и период оплаты.
          </p>
          <BillingPeriodToggle value={billingPeriod} onChange={setBillingPeriod} />
        </header>

        <ul className="billing-value-row" aria-label="Почему Trainly">
          {VALUE_PROPS.map((item) => (
            <li key={item.title} className="billing-value-card">
              <span className="billing-value-card-dot" aria-hidden />
              <p className="billing-value-card-title">{item.title}</p>
              <p className="billing-value-card-text">{item.text}</p>
            </li>
          ))}
        </ul>

        {environment === "postgres" && yookassaConfigured ? (
          <p className="billing-pay-hint billing-pay-hint--accent">
            Оплата через <strong>ЮKassa</strong> — защищённая страница после выбора тарифа.
          </p>
        ) : null}
        {environment === "postgres" && !yookassaConfigured ? (
          <p className="billing-pay-hint">Демо: реальная оплата пока не подключена на сервере.</p>
        ) : null}

        {featuredPlan ? (
          <section className="billing-featured-section" aria-label="Тариф Pro">
            <PlanCardFromEntry plan={featuredPlan} featured billingPeriod={billingPeriod} />
          </section>
        ) : null}

        <section className="billing-plans-list" aria-label="Другие тарифы">
          <div className="billing-plans-stack">
            {otherPlans.map((plan) => (
              <PlanCardFromEntry key={plan.id} plan={plan} billingPeriod={billingPeriod} />
            ))}
          </div>
        </section>

        <footer className="billing-plans-footer">
          <p className="billing-plans-footer-note">
            Нужна помощь с выбором?{" "}
            <Link href="/support" prefetch={false} className="billing-plans-footer-link">
              Напишите в поддержку
            </Link>
          </p>
          <nav aria-label="Правовая информация" className="billing-legal-nav">
            <Link href="/legal/offer" prefetch={false}>
              Оферта
            </Link>
            <Link href="/legal/tariffs" prefetch={false}>
              Тарифы
            </Link>
            <Link href="/legal/refund" prefetch={false}>
              Оплата и возврат
            </Link>
          </nav>
        </footer>
      </div>
    </ShellMain>
  );
}
