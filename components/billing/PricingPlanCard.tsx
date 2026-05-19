import Link from "next/link";
import type { ReactElement, ReactNode } from "react";
import type { PlanPriceUi } from "@/lib/billing/planDefinitions";

const iconSvgCls = "h-[1.35rem] w-[1.35rem] shrink-0 text-current";

function parsePriceDisplay(priceLine: string): { amount: string; period: string | null } {
  const slash = priceLine.indexOf("/");
  if (slash === -1) return { amount: priceLine.trim(), period: null };
  return {
    amount: priceLine.slice(0, slash).trim(),
    period: priceLine.slice(slash + 1).trim(),
  };
}

function CheckIcon(): ReactElement {
  return (
    <span className="billing-plan-check" aria-hidden>
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function CtaArrow(): ReactElement {
  return (
    <svg className="billing-plan-cta-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PlanIconFree(): ReactElement {
  return (
    <svg className={iconSvgCls} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3.2l2.2 5.5 5.9.5-4.5 3.6 1.5 5.7L12 15.9l-5.1 3.6 1.5-5.7-4.5-3.6 5.9-.5L12 3.2z"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PlanIconStart(): ReactElement {
  return (
    <svg className={iconSvgCls} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 19V12M10 19V9M15 19v-5.5M20 19V6" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" />
      <path
        d="M5.5 10.5L9 13l3.2-3.8 2.8 2.5"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PlanIconPro(): ReactElement {
  return (
    <svg className={iconSvgCls} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 17l1.8-8 4.2 3 4-7 4 7 4.2-3L20 17H4z"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinejoin="round"
      />
      <path d="M6 17h12" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" />
    </svg>
  );
}

export function PlanIconExpert(): ReactElement {
  return (
    <svg className={iconSvgCls} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4.2L15.4 12H17l-5 9.8-5-9.8h1.6L12 4.2z"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinejoin="round"
      />
      <path
        d="M9.4 12.3L7.2 16.8M14.6 12.3L16.8 16.8"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
      />
      <circle cx="12" cy="10.2" r="1.25" fill="currentColor" opacity="0.45" />
    </svg>
  );
}

export const PlanIconMax = PlanIconExpert;
export const PlanIconTrial = PlanIconFree;

export function PlanIconStudio(): ReactElement {
  return (
    <svg className={iconSvgCls} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 20V9l8-4 8 4v11M4 20h16M9 20v-5h6v5"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinejoin="round"
      />
      <path d="M9 9h6M9 13h6" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" />
    </svg>
  );
}

type PlanCardVariant = "hero" | "secondary";

export interface PricingPlanCardProps {
  planId: string;
  icon: ReactNode;
  title: string;
  /** Статичная строка (Studio) или из getPlanPriceUi для платных тарифов. */
  priceLine?: string;
  priceUi?: PlanPriceUi;
  limitLine: string;
  tagline: string;
  description?: string;
  featuresIntro?: string;
  badgeLabel?: string;
  features: readonly string[];
  ctaLabel: string;
  variant: PlanCardVariant;
  featured?: boolean;
  /** Витрина /billing/plans: tagline, компактный список, без дубля годовой цены. */
  showcase?: boolean;
  ctaHref?: string;
  ctaOnClick?: () => void;
}

export function PricingPlanCard({
  planId,
  icon,
  title,
  priceLine,
  priceUi,
  limitLine,
  tagline,
  description,
  featuresIntro = "Входит",
  badgeLabel,
  features,
  ctaLabel,
  variant,
  featured = false,
  showcase = false,
  ctaHref,
  ctaOnClick,
}: PricingPlanCardProps): ReactElement {
  const isHero = variant === "hero" || featured;
  const staticPrice = priceLine != null ? parsePriceDisplay(priceLine) : null;
  const amount = priceUi?.amount ?? staticPrice?.amount ?? "";
  const period = priceUi?.period ?? staticPrice?.period ?? null;
  const altLine = showcase ? null : (priceUi?.altLine ?? null);
  const chargeLine = priceUi?.chargeLine ?? null;
  const showTagline = tagline.length > 0;
  const showDescription =
    description != null && description.length > 0 && (!showcase || featured);
  const featuresDense = showcase && !featured;

  const ctaInner = (
    <>
      <span>{ctaLabel}</span>
      <CtaArrow />
    </>
  );

  const ctaNode =
    ctaOnClick != null ? (
      <button type="button" onClick={ctaOnClick} className="billing-plan-cta">
        {ctaInner}
      </button>
    ) : (
      <Link href={ctaHref ?? "/billing/plans"} prefetch={false} className="billing-plan-cta">
        {ctaInner}
      </Link>
    );

  const featuresBlock = (
    <div className="billing-plan-features-wrap">
      <p className="billing-plan-features-label">{featuresIntro}</p>
      <ul className={featuresDense ? "billing-plan-features billing-plan-features--dense" : "billing-plan-features"}>
        {features.map((line) => (
          <li key={line}>
            <CheckIcon />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <article
      data-plan-id={planId}
      className={[
        "billing-plan-card",
        "trainly-surface-card",
        isHero ? "billing-plan-card--hero" : "billing-plan-card--standard",
        featured ? "billing-plan-card--featured" : "",
        showcase ? "billing-plan-card--showcase" : "",
        planId === "studio" ? "billing-plan-card--studio" : "",
        planId === "free" ? "billing-plan-card--free" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {featured ? (
        <div className="billing-plan-ribbon" aria-hidden>
          <span>Рекомендуем</span>
        </div>
      ) : null}

      <div className="billing-plan-card-inner">
        <div className="billing-plan-card-glow" aria-hidden />

        <header className="billing-plan-head">
          <div className="billing-plan-icon">{icon}</div>
          <div className="billing-plan-head-copy">
            <div className="billing-plan-title-row">
              <h2 className="billing-plan-title">{title}</h2>
              {badgeLabel ? <span className="billing-plan-badge">{badgeLabel}</span> : null}
            </div>
            <p className="billing-plan-limit">{limitLine}</p>
          </div>
        </header>

        <div className="billing-plan-price-block">
          <p className="billing-plan-price">
            <span className="billing-plan-price-amount">{amount}</span>
            {period ? <span className="billing-plan-price-period">/ {period}</span> : null}
          </p>
          {altLine ? <p className="billing-plan-price-alt">{altLine}</p> : null}
          {chargeLine ? <p className="billing-plan-price-charge">{chargeLine}</p> : null}
          {showTagline ? <p className="billing-plan-tagline">{tagline}</p> : null}
          {showDescription ? <p className="billing-plan-description">{description}</p> : null}
        </div>

        {featuresBlock}

        <div className="billing-plan-cta-wrap">{ctaNode}</div>
      </div>
    </article>
  );
}
