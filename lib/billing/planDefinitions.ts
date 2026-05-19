/** Статичные тарифы: единый источник для UI, checkout, лимитов и черновика /legal/tariffs. */

export type PaidPlanSlug = "start" | "pro" | "expert";

export type BillingPeriod = "month" | "year";

export type CheckoutPlanParam = PaidPlanSlug | "free" | "trial" | "invalid";

/** Бесплатный тариф (без YooKassa). */
export const FREE_PLAN_PUBLIC = {
  slug: "free" as const,
  name: "Free",
  priceLine: "0 ₽",
  limitLine: "до 2 активных клиентов",
  tagline: "Для знакомства с Trainly.",
  description:
    "Проведите первые тренировки, посмотрите журнал и попробуйте заменить блокнот.",
  features: [
    "клиенты",
    "тренировки",
    "журнал",
    "график",
    "оплаты занятий",
    "быстрые заметки",
    "шаблоны",
  ] as const,
};

/** @deprecated Используйте FREE_PLAN_PUBLIC */
export const TRIAL_PLAN_PUBLIC = FREE_PLAN_PUBLIC;

export interface PaidPlanPeriodPricing {
  /** Сумма к оплате (месяц или год целиком). */
  chargeRub: number;
  /** Эквивалент в месяц для отображения на карточке. */
  displayMonthlyRub: number;
}

export interface PaidPlanPricingRow {
  slug: PaidPlanSlug;
  name: string;
  clientLimit: number;
  month: PaidPlanPeriodPricing;
  year: PaidPlanPeriodPricing;
  summaryLine: string;
}

export const PAID_PLAN_PRICING: Record<PaidPlanSlug, PaidPlanPricingRow> = {
  start: {
    slug: "start",
    name: "Start",
    clientLimit: 10,
    month: { chargeRub: 690, displayMonthlyRub: 690 },
    year: { chargeRub: 6900, displayMonthlyRub: 575 },
    summaryLine: "до 10 активных клиентов · архив · история оплат",
  },
  pro: {
    slug: "pro",
    name: "Pro",
    clientLimit: 30,
    month: { chargeRub: 1490, displayMonthlyRub: 1490 },
    year: { chargeRub: 14900, displayMonthlyRub: 1242 },
    summaryLine: "до 30 активных клиентов · расширенная карточка клиента",
  },
  expert: {
    slug: "expert",
    name: "Expert",
    clientLimit: 80,
    month: { chargeRub: 2990, displayMonthlyRub: 2990 },
    year: { chargeRub: 29900, displayMonthlyRub: 2492 },
    summaryLine: "до 80 активных клиентов · приоритетная поддержка",
  },
};

/** @deprecated Используйте getPaidPlanCheckoutQuote */
export interface PaidPlanCheckoutInfo {
  slug: PaidPlanSlug;
  name: string;
  amountRub: number;
  clientLimit: number;
  summaryLine: string;
}

/** Совместимость: месячные суммы. */
export const PAID_PLAN_CHECKOUT: Record<PaidPlanSlug, PaidPlanCheckoutInfo> = {
  start: {
    slug: "start",
    name: PAID_PLAN_PRICING.start.name,
    amountRub: PAID_PLAN_PRICING.start.month.chargeRub,
    clientLimit: PAID_PLAN_PRICING.start.clientLimit,
    summaryLine: PAID_PLAN_PRICING.start.summaryLine,
  },
  pro: {
    slug: "pro",
    name: PAID_PLAN_PRICING.pro.name,
    amountRub: PAID_PLAN_PRICING.pro.month.chargeRub,
    clientLimit: PAID_PLAN_PRICING.pro.clientLimit,
    summaryLine: PAID_PLAN_PRICING.pro.summaryLine,
  },
  expert: {
    slug: "expert",
    name: PAID_PLAN_PRICING.expert.name,
    amountRub: PAID_PLAN_PRICING.expert.month.chargeRub,
    clientLimit: PAID_PLAN_PRICING.expert.clientLimit,
    summaryLine: PAID_PLAN_PRICING.expert.summaryLine,
  },
};

export interface PaidPlanCheckoutQuote {
  slug: PaidPlanSlug;
  name: string;
  billingPeriod: BillingPeriod;
  amountRub: number;
  clientLimit: number;
  summaryLine: string;
  periodLabelRu: string;
}

export function formatPlanRub(amount: number): string {
  return `${amount.toLocaleString("ru-RU")} ₽`;
}

export function parseBillingPeriodParam(value: string | null): BillingPeriod {
  if (value === "year" || value === "annual") return "year";
  return "month";
}

export function billingPeriodQueryValue(period: BillingPeriod): string {
  return period === "year" ? "year" : "month";
}

export function getPaidPlanCheckoutQuote(slug: PaidPlanSlug, period: BillingPeriod): PaidPlanCheckoutQuote {
  const row = PAID_PLAN_PRICING[slug];
  const tier = period === "year" ? row.year : row.month;
  return {
    slug,
    name: row.name,
    billingPeriod: period,
    amountRub: tier.chargeRub,
    clientLimit: row.clientLimit,
    summaryLine: row.summaryLine,
    periodLabelRu: period === "year" ? "год" : "месяц",
  };
}

export interface PlanPriceUi {
  amount: string;
  period: string;
  altLine: string | null;
  chargeLine: string | null;
}

export function getPlanPriceUi(slug: PaidPlanSlug, period: BillingPeriod): PlanPriceUi {
  const row = PAID_PLAN_PRICING[slug];
  if (period === "month") {
    return {
      amount: formatPlanRub(row.month.displayMonthlyRub),
      period: "мес",
      altLine: `или ${formatPlanRub(row.year.displayMonthlyRub)} / мес при оплате за год`,
      chargeLine: null,
    };
  }
  return {
    amount: formatPlanRub(row.year.displayMonthlyRub),
    period: "мес",
    altLine: null,
    chargeLine: `${formatPlanRub(row.year.chargeRub)} за год`,
  };
}

export function paidPlanYearlySavingsPercent(slug: PaidPlanSlug): number {
  const row = PAID_PLAN_PRICING[slug];
  const monthlyYearCost = row.month.displayMonthlyRub * 12;
  if (monthlyYearCost <= 0) return 0;
  return Math.round(((monthlyYearCost - row.year.chargeRub) / monthlyYearCost) * 100);
}

export function maxYearlySavingsPercent(): number {
  let max = 0;
  for (const slug of ["start", "pro", "expert"] as const) {
    max = Math.max(max, paidPlanYearlySavingsPercent(slug));
  }
  return max;
}

export function buildCheckoutHref(slug: PaidPlanSlug, period: BillingPeriod): string {
  return `/billing/checkout?plan=${encodeURIComponent(slug)}&period=${encodeURIComponent(billingPeriodQueryValue(period))}`;
}

/** Нормализация plan_code из БД (max → expert). */
export function normalizePaidPlanSlug(planCode: string | null | undefined): PaidPlanSlug | null {
  if (planCode == null || planCode.trim().length === 0) return null;
  const v = planCode.trim().toLowerCase();
  if (v === "max") return "expert";
  if (v === "start" || v === "pro" || v === "expert") return v;
  return null;
}

export function isPaidPlanSlug(value: string): value is PaidPlanSlug {
  return normalizePaidPlanSlug(value) != null;
}

export function parseCheckoutPlanParam(value: string | null): CheckoutPlanParam {
  if (value === "free" || value === "trial") return "free";
  const paid = normalizePaidPlanSlug(value);
  if (paid != null) return paid;
  if (value == null || value.trim() === "") return "invalid";
  return "invalid";
}

export function parsePaidPlanFromSearchParam(value: string | null): PaidPlanSlug {
  const p = parseCheckoutPlanParam(value);
  if (p === "start" || p === "pro" || p === "expert") return p;
  return "pro";
}

export function parsePaidPlanSlugStrict(value: string | null): PaidPlanSlug | null {
  const p = parseCheckoutPlanParam(value);
  if (p === "start" || p === "pro" || p === "expert") return p;
  return null;
}

export function trainlyPaidPlanLabelFromDb(planCode: string | null | undefined): string {
  const slug = normalizePaidPlanSlug(planCode);
  if (slug != null) return PAID_PLAN_PRICING[slug].name;
  if (planCode == null || planCode.trim().length === 0) return "не указан";
  return planCode.trim();
}

export type BillingPlanCardKind = "free" | "paid" | "studio";

export interface BillingPlanCatalogEntry {
  id: string;
  kind: BillingPlanCardKind;
  name: string;
  priceLine: string;
  limitLine: string;
  tagline: string;
  description: string;
  features: readonly string[];
  featuresIntro: string;
  badgeLabel?: string;
  variant: "hero" | "secondary";
  ctaLabel: string;
  paidSlug?: PaidPlanSlug;
  ctaHref?: string;
}

export const BILLING_PLAN_CATALOG: readonly BillingPlanCatalogEntry[] = [
  {
    id: "start",
    kind: "paid",
    name: "Start",
    priceLine: "690 ₽ / месяц",
    limitLine: "до 10 активных клиентов",
    tagline: "Для начинающего тренера.",
    description: "Ведите клиентов, тренировки, график и оплаты занятий без хаоса в заметках.",
    features: [
      "клиенты, тренировки, журнал и график",
      "до 10 активных клиентов",
      "архив клиентов",
      "история оплат",
      "повтор прошлой тренировки",
      "личные шаблоны",
    ],
    featuresIntro: "Входит:",
    variant: "secondary",
    ctaLabel: "Выбрать Start",
    paidSlug: "start",
  },
  {
    id: "pro",
    kind: "paid",
    name: "Pro",
    priceLine: "1 490 ₽ / месяц",
    limitLine: "до 30 активных клиентов",
    tagline: "Для персонального тренера с постоянной базой.",
    description:
      "Trainly становится рабочим дневником: клиент, история, график, оплата и тренировки в одном месте.",
    features: [
      "всё из Start",
      "до 30 активных клиентов",
      "расширенная карточка клиента",
      "удобная история тренировок",
      "быстрый старт из графика",
      "подсказки «что учесть»",
      "приоритет новых функций",
    ],
    featuresIntro: "Входит:",
    badgeLabel: "Лучший выбор",
    variant: "hero",
    ctaLabel: "Выбрать Pro",
    paidSlug: "pro",
  },
  {
    id: "expert",
    kind: "paid",
    name: "Expert",
    priceLine: "2 990 ₽ / месяц",
    limitLine: "до 80 активных клиентов",
    tagline: "Для тренеров с плотным графиком, онлайн-сопровождением и большой клиентской базой.",
    description: "",
    features: [
      "всё из Pro",
      "до 80 активных клиентов",
      "расширенные фильтры клиентов",
      "больше возможностей для шаблонов",
      "расширенная статистика в будущем",
      "приоритетная поддержка",
      "ранний доступ к новым функциям",
    ],
    featuresIntro: "Входит:",
    variant: "secondary",
    ctaLabel: "Выбрать Expert",
    paidSlug: "expert",
  },
  {
    id: "studio",
    kind: "studio",
    name: "Studio",
    priceLine: "от 6 900 ₽ / месяц",
    limitLine: "для 3+ тренеров",
    tagline: "Для студий и команд.",
    description:
      "Общий график, клиенты, тренировки и контроль работы тренеров в одном пространстве.",
    features: [
      "несколько тренеров",
      "общая база клиентов",
      "роли и доступы",
      "общий график",
      "поддержка подключения",
      "индивидуальные условия",
    ],
    featuresIntro: "Входит:",
    variant: "secondary",
    ctaLabel: "Обсудить Studio",
    ctaHref: "/support",
  },
];

function catalogPriceLinesForLegal(name: string, slug: PaidPlanSlug): readonly string[] {
  const row = PAID_PLAN_PRICING[slug];
  return [
    `${formatPlanRub(row.month.displayMonthlyRub)} / мес`,
    `или ${formatPlanRub(row.year.displayMonthlyRub)} / мес при оплате за год`,
    `${formatPlanRub(row.year.chargeRub)} списывается один раз в год`,
  ];
}

export function getLegalTariffDraftBlocks(): readonly { title: string; lines: readonly string[] }[] {
  const freeBlock = {
    title: FREE_PLAN_PUBLIC.name,
    lines: [
      FREE_PLAN_PUBLIC.priceLine,
      FREE_PLAN_PUBLIC.limitLine,
      FREE_PLAN_PUBLIC.tagline,
      FREE_PLAN_PUBLIC.description,
      "Входит:",
      ...FREE_PLAN_PUBLIC.features,
    ] as const,
  };
  const paidBlocks = BILLING_PLAN_CATALOG.filter((p) => p.paidSlug != null).map((p) => ({
    title: p.name,
    lines: [
      ...catalogPriceLinesForLegal(p.name, p.paidSlug!),
      p.limitLine,
      p.tagline,
      ...(p.description ? [p.description] : []),
      p.featuresIntro,
      ...p.features,
    ],
  }));
  const studio = BILLING_PLAN_CATALOG.find((p) => p.id === "studio");
  const studioBlock = studio
    ? {
        title: studio.name,
        lines: [
          studio.priceLine,
          studio.limitLine,
          studio.tagline,
          studio.description,
          studio.featuresIntro,
          ...studio.features,
        ],
      }
    : null;
  return studioBlock ? [freeBlock, ...paidBlocks, studioBlock] : [freeBlock, ...paidBlocks];
}

export const LEGAL_TARIFF_DRAFT_NOTE =
  "Тарифы указаны для черновика продукта. Перед запуском условия должны быть закреплены в оферте и проверены юристом.";

export function accessValidDaysForBillingPeriod(period: BillingPeriod): number {
  return period === "year" ? 365 : 30;
}
