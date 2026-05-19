"use client";

import type { ReactElement } from "react";
import type { BillingPeriod } from "@/lib/billing/planDefinitions";
import { maxYearlySavingsPercent } from "@/lib/billing/planDefinitions";

interface BillingPeriodToggleProps {
  value: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
}

export function BillingPeriodToggle({ value, onChange }: BillingPeriodToggleProps): ReactElement {
  const savings = maxYearlySavingsPercent();

  return (
    <div className="billing-period-bar">
      <p className="billing-period-bar__label">Период оплаты</p>
      <div className="billing-period-toggle" role="group" aria-label="Период оплаты">
        <button
          type="button"
          className={`billing-period-toggle__btn ${value === "month" ? "billing-period-toggle__btn--active" : ""}`}
          aria-pressed={value === "month"}
          onClick={() => onChange("month")}
        >
          Помесячно
        </button>
        <button
          type="button"
          className={`billing-period-toggle__btn ${value === "year" ? "billing-period-toggle__btn--active" : ""}`}
          aria-pressed={value === "year"}
          onClick={() => onChange("year")}
        >
          <span>За год</span>
          {savings > 0 ? <span className="billing-period-toggle__save">−{savings}%</span> : null}
        </button>
      </div>
      <p className="billing-period-bar__hint">
        {value === "year" ? "Одним платежом на 12 месяцев" : "Списание каждый месяц"}
      </p>
    </div>
  );
}
