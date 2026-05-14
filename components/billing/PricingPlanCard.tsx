import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

const iconSvgCls = "h-[1.35rem] w-[1.35rem] shrink-0 text-current";

const checkIcon = (
  <svg className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-solid)]" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Иконка Trial — звезда «без риска». */
export function PlanIconTrial(): ReactElement {
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

/** Иконка Start — столбики / график. */
export function PlanIconStart(): ReactElement {
  return (
    <svg className={iconSvgCls} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 19V12M10 19V9M15 19v-5.5M20 19V6"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
      />
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

/** Иконка Pro — корона. */
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

/** Иконка Max — ракета. */
export function PlanIconMax(): ReactElement {
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

type PlanCardVariant = "hero" | "secondary";

function IconBox({ children, variant }: { children: ReactNode; variant: PlanCardVariant }): ReactElement {
  const base =
    "flex h-11 w-11 min-h-[2.75rem] min-w-[2.75rem] shrink-0 items-center justify-center rounded-xl border backdrop-blur-sm";
  const byVariant =
    variant === "hero"
      ? "border-[color:color-mix(in_srgb,var(--brand-solid),transparent_38%)] bg-[color:color-mix(in_srgb,var(--brand-solid),transparent_86%)] text-[var(--brand-solid)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
      : "border-[color:var(--border-violet-soft)] bg-[color:color-mix(in_srgb,var(--tg-bg),transparent_38%)] text-[color:color-mix(in_srgb,var(--brand-solid),var(--text-secondary)_20%)]";

  return <div className={`${base} ${byVariant}`}>{children}</div>;
}

export interface PricingPlanCardProps {
  icon: ReactNode;
  title: string;
  priceLine: string;
  badgeLabel?: string;
  helperLine?: string;
  features: readonly string[];
  ctaLabel: string;
  variant: PlanCardVariant;
  /** Ссылка на оплату/чекаут; не используется вместе с `ctaOnClick`. */
  ctaHref?: string;
  /** Действие без перехода на checkout (например Trial). */
  ctaOnClick?: () => void;
}

export function PricingPlanCard({
  icon,
  title,
  priceLine,
  badgeLabel,
  helperLine,
  features,
  ctaLabel,
  variant,
  ctaHref,
  ctaOnClick,
}: PricingPlanCardProps): ReactElement {
  const isHero = variant === "hero";

  const ctaBase =
    "app-btn cursor-pointer flex min-h-[50px] w-full min-w-0 max-w-full items-center justify-center rounded-2xl px-4 py-3.5 text-center text-[15px] font-bold leading-tight tracking-tight";

  const ctaHero = `${ctaBase} bg-brand-gradient text-white shadow-[0_10px_32px_rgba(168,85,247,0.42)] ring-1 ring-[color:color-mix(in_srgb,var(--brand-solid),transparent_55%)]`;

  const ctaSecondary = `${ctaBase} border border-[color:var(--border-strong)] bg-[color:color-mix(in_srgb,var(--tg-bg),transparent_14%)] font-semibold text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]`;

  const ctaClass = isHero ? ctaHero : ctaSecondary;

  const headerBlock = (
    <div className="flex w-full min-w-0 max-w-full items-start gap-3">
      <IconBox variant={variant}>{icon}</IconBox>
      <div className="min-w-0 flex-1 basis-0 max-w-full overflow-hidden pt-0.5">
        <div className="flex min-w-0 max-w-full flex-col gap-1.5">
          <div className="flex min-w-0 max-w-full flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="min-w-0 max-w-full font-display text-lg font-bold tracking-tight text-[var(--text-primary)] sm:text-xl">
              {title}
            </h2>
            {badgeLabel ? (
              <span className="inline-flex max-w-full shrink-0 items-center gap-1 rounded-full border border-[color:var(--border-violet-soft)] bg-[color:color-mix(in_srgb,var(--brand-solid),transparent_86%)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--text-primary)] sm:text-xs">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="shrink-0">
                  <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6-4.5-6 4.5 2.3-7-6-4.6h7.6z" />
                </svg>
                <span className="min-w-0 truncate">{badgeLabel}</span>
              </span>
            ) : null}
          </div>
          <p className="max-w-full text-base font-semibold tabular-nums text-[var(--text-primary)] sm:text-lg">{priceLine}</p>
          {helperLine ? (
            <p className="max-w-full text-[13px] leading-snug text-[var(--text-secondary)] sm:text-sm">{helperLine}</p>
          ) : null}
        </div>
      </div>
    </div>
  );

  const featuresBlock = (
    <ul className="flex w-full min-w-0 max-w-full flex-col gap-2.5 pt-1">
      {features.map((line) => (
        <li key={line} className="flex w-full min-w-0 max-w-full gap-2.5 text-sm leading-snug text-[var(--text-secondary)]">
          {checkIcon}
          <span className="min-w-0 flex-1">{line}</span>
        </li>
      ))}
    </ul>
  );

  const body = (
    <div className="relative flex w-full min-w-0 max-w-full flex-col gap-5">
      {headerBlock}
      {featuresBlock}
      <div className="mt-1 w-full min-w-0 pt-0.5">
        {ctaOnClick != null ? (
          <button type="button" onClick={ctaOnClick} className={ctaClass}>
            {ctaLabel}
          </button>
        ) : (
          <Link href={ctaHref ?? "/billing/plans"} prefetch={false} className={ctaClass}>
            {ctaLabel}
          </Link>
        )}
      </div>
    </div>
  );

  const padded = (
    <div className="relative w-full min-w-0 overflow-hidden p-4 sm:p-5">
      {isHero ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(165deg,color-mix(in_srgb,var(--brand-purple),transparent_90%)_0%,transparent_45%)]"
        />
      ) : null}
      <div className={isHero ? "relative" : ""}>{body}</div>
    </div>
  );

  if (isHero) {
    return (
      <article className="w-full min-w-0 max-w-full rounded-[1.38rem] p-[1px] shadow-[0_0_48px_rgba(168,85,247,0.26)] [background:linear-gradient(135deg,color-mix(in_srgb,var(--brand-purple),transparent_10%),color-mix(in_srgb,var(--brand-pink),transparent_6%),color-mix(in_srgb,var(--brand-solid),transparent_14%))]">
        <div className="rounded-[1.32rem] bg-[color:color-mix(in_srgb,var(--bg-card),transparent_5%)] backdrop-blur-md">{padded}</div>
      </article>
    );
  }

  return (
    <article className="w-full min-w-0 max-w-full rounded-[1.25rem] border border-[color:var(--border-soft)] bg-[color:color-mix(in_srgb,var(--bg-card),transparent_22%)] shadow-[0_10px_36px_rgba(0,0,0,0.28)] backdrop-blur-md">
      {padded}
    </article>
  );
}
