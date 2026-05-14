"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { PageHeader } from "@/components/prod-shell/PageHeader";
import { ShellMain } from "@/components/prod-shell/ShellMain";
import { subscriptionStatusLabelRu, type MockSubscriptionStatus } from "@/lib/mock/lifecycleTypes";
import { useMockApp } from "@/lib/mock/MockAppProvider";

const devBtn =
  "app-btn rounded-lg border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-2 py-1.5 text-center text-[11px] font-medium text-[var(--text-secondary)] hover:border-[color:var(--border-violet-soft)]";

export function BillingManageContent(): ReactElement {
  const {
    aiCreditsTotal,
    aiCreditsUsed,
    mockLifecycle,
    setMockSubscriptionStatus,
    resetMockLifecycle,
  } = useMockApp();
  const remaining = Math.max(0, aiCreditsTotal - aiCreditsUsed);
  const sub = mockLifecycle.mockSubscriptionStatus;

  const setSub = (s: MockSubscriptionStatus): void => {
    void Promise.resolve(setMockSubscriptionStatus(s));
  };

  return (
    <ShellMain>
      <PageHeader title="Подписка" backHref="/profile" />

      <div className="premium-surface min-w-0 space-y-3 p-4 text-sm text-[var(--text-secondary)]">
        <div className="flex flex-wrap justify-between gap-2">
          <span className="text-[var(--tg-muted)]">Режим доступа</span>
          <span className="min-w-0 text-right font-medium text-[var(--text-primary)]">{subscriptionStatusLabelRu(sub)}</span>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <span className="text-[var(--tg-muted)]">Тариф</span>
          <span className="min-w-0 text-right font-medium text-[var(--text-primary)]">
            {sub === "active" ? "Демо: активирован вручную" : "не подключён"}
          </span>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <span className="text-[var(--tg-muted)]">AI-подготовки</span>
          <span className="font-medium tabular-nums text-[var(--text-primary)]">
            осталось {remaining} из {aiCreditsTotal} (демо)
          </span>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <span className="text-[var(--tg-muted)]">Следующее списание</span>
          <span className="text-right font-medium text-[var(--text-primary)]">будет позже</span>
        </div>
      </div>

      <Link
        href="/billing/plans"
        prefetch={false}
        className="app-btn block w-full rounded-2xl bg-[var(--tg-accent)] px-4 py-3 text-center text-sm font-semibold text-white shadow-app-primary"
      >
        Сменить тариф
      </Link>
      <Link
        href="/billing/history"
        prefetch={false}
        className="app-btn block w-full rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] py-3 text-center text-sm font-semibold text-[var(--text-primary)]"
      >
        История оплат
      </Link>
      <Link
        href="/legal/offer"
        prefetch={false}
        className="block text-center text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        Оферта
      </Link>

      <section
        className="rounded-2xl border border-dashed border-[color:var(--border-soft)] bg-[color:color-mix(in_srgb,var(--tg-bg),transparent_30%)] p-3 opacity-90"
        aria-label="Демо-настройки разработки"
      >
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--tg-muted)]">
          Демо-настройки разработки
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-muted)]">
          Не продакшен-биллинг. Только локальное состояние в браузере.
        </p>
        <div className="mt-2 flex min-w-0 flex-wrap gap-1.5">
          <button type="button" className={devBtn} onClick={() => setSub("demo_unlimited")}>
            Демо без ограничений
          </button>
          <button type="button" className={devBtn} onClick={() => setSub("trial")}>
            Пробный период
          </button>
          <button type="button" className={devBtn} onClick={() => setSub("active")}>
            Подписка активна
          </button>
          <button type="button" className={devBtn} onClick={() => setSub("expired")}>
            Доступ истёк
          </button>
          <button type="button" className={`${devBtn} border-[color:color-mix(in_srgb,var(--danger),transparent_55%)]`} onClick={() => void resetMockLifecycle()}>
            Сбросить демо-путь
          </button>
        </div>
      </section>
    </ShellMain>
  );
}
