/** Статичные тарифы для UI PROD-SHELL-1 (без сервера). Единый источник цифр для планов и черновика /legal/tariffs. */

export type PaidPlanSlug = "start" | "pro" | "max";

export type CheckoutPlanParam = PaidPlanSlug | "trial" | "invalid";

/** Пробный тариф: не проходит через оплату (без YooKassa). */
export const TRIAL_PLAN_PUBLIC = {
  slug: "trial" as const,
  name: "Trial",
  priceLine: "0 ₽",
  periodLabel: "14 дней",
  helperLine: "Без карты · без обязательств",
  features: ["Все функции Pro", "30 AI-подготовок", "Без карты"] as const,
};

export interface PaidPlanCheckoutInfo {
  slug: PaidPlanSlug;
  name: string;
  amountRub: number;
  /** Кратко для экрана подтверждения */
  summaryLine: string;
}

export const PAID_PLAN_CHECKOUT: Record<PaidPlanSlug, PaidPlanCheckoutInfo> = {
  start: {
    slug: "start",
    name: "Start",
    amountRub: 690,
    summaryLine: "15 активных клиентов · 30 AI-подготовок / мес · безлимит тренировок",
  },
  pro: {
    slug: "pro",
    name: "Pro",
    amountRub: 1190,
    summaryLine: "60 активных клиентов · 150 AI-подготовок / мес",
  },
  max: {
    slug: "max",
    name: "Max",
    amountRub: 2490,
    summaryLine: "150 активных клиентов · 500 AI-подготовок / мес",
  },
};

/** Параметр ?plan= для экрана checkout: только платные; trial и мусор обрабатываются отдельно. */
export function parseCheckoutPlanParam(value: string | null): CheckoutPlanParam {
  if (value === "trial") return "trial";
  if (value === "start" || value === "pro" || value === "max") return value;
  if (value == null || value.trim() === "") return "invalid";
  return "invalid";
}

/** Для успешной оплаты и мест, где нужен только платный slug (fallback Pro). */
export function parsePaidPlanFromSearchParam(value: string | null): PaidPlanSlug {
  const p = parseCheckoutPlanParam(value);
  if (p === "start" || p === "pro" || p === "max") return p;
  return "pro";
}

/** Только платный slug или null (для экрана успеха без подмены trial на Pro). */
export function parsePaidPlanSlugStrict(value: string | null): PaidPlanSlug | null {
  const p = parseCheckoutPlanParam(value);
  if (p === "start" || p === "pro" || p === "max") return p;
  return null;
}

/** Черновик для /legal/tariffs — синхронизирован с PAID_PLAN_CHECKOUT и TRIAL_PLAN_PUBLIC. */
export function getLegalTariffDraftBlocks(): readonly { title: string; lines: readonly string[] }[] {
  return [
    {
      title: "Trial",
      lines: [`${TRIAL_PLAN_PUBLIC.priceLine} · ${TRIAL_PLAN_PUBLIC.periodLabel}`, ...TRIAL_PLAN_PUBLIC.features],
    },
    {
      title: "Start",
      lines: [
        `${PAID_PLAN_CHECKOUT.start.amountRub.toLocaleString("ru-RU")} ₽ / мес`,
        "15 активных клиентов",
        "30 AI-подготовок / мес",
      ],
    },
    {
      title: "Pro",
      lines: [
        `${PAID_PLAN_CHECKOUT.pro.amountRub.toLocaleString("ru-RU")} ₽ / мес`,
        "60 активных клиентов",
        "150 AI-подготовок / мес",
        "Лучший выбор",
      ],
    },
    {
      title: "Max",
      lines: [
        `${PAID_PLAN_CHECKOUT.max.amountRub.toLocaleString("ru-RU")} ₽ / мес`,
        "150 активных клиентов",
        "500 AI-подготовок / мес",
      ],
    },
  ];
}

export const LEGAL_TARIFF_DRAFT_NOTE =
  "Тарифы указаны для черновика продукта. Перед запуском условия должны быть закреплены в оферте и проверены юристом.";
