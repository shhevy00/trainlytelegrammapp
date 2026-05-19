"use client";

import Link from "next/link";
import { useState, type ReactElement } from "react";
import type { TrainlyDataSource } from "@/lib/config/dataSource";
import { mockTrainer } from "@/lib/mock/data";
import { subscriptionStatusLabelRu } from "@/lib/mock/lifecycleTypes";
import { useMockApp } from "@/lib/mock/MockAppProvider";

const menuLink =
  "app-btn flex min-h-[48px] w-full items-center justify-between gap-3 rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3.5 py-3 text-left text-sm font-medium text-[var(--text-primary)] transition hover:border-[color:color-mix(in_srgb,var(--brand-solid),transparent_50%)]";

const menuLinkDanger =
  "app-btn flex min-h-[48px] w-full items-center justify-between gap-3 rounded-xl border border-[color:color-mix(in_srgb,var(--danger),transparent_45%)] bg-[color:color-mix(in_srgb,var(--danger),transparent_94%)] px-3.5 py-3 text-left text-sm font-medium text-[var(--danger)]";

function MenuArrow(): ReactElement {
  return (
    <span aria-hidden className="shrink-0 text-[var(--tg-muted)]">
      →
    </span>
  );
}

export interface TrainerProfileContentProps {
  trainlyDataMode: TrainlyDataSource;
  yookassaBillingConfigured: boolean;
}

export function TrainerProfileContent({
  trainlyDataMode,
  yookassaBillingConfigured,
}: TrainerProfileContentProps): ReactElement {
  const { mockLifecycle, resetMockLifecycle } = useMockApp();
  const [docsOpen, setDocsOpen] = useState(false);

  const profile = mockLifecycle.trainerProfile;
  const displayName = profile?.displayName.trim() || mockTrainer.firstName.trim() || "Тренер";
  const specialization = profile?.specialization?.trim() ?? "";
  const city = profile?.city?.trim() ?? "";
  const accessLabel = subscriptionStatusLabelRu(mockLifecycle.mockSubscriptionStatus);
  const initial = displayName.charAt(0).toUpperCase() || "T";

  const billingHint =
    trainlyDataMode === "mock"
      ? "Демо-режим: подписка не списывается."
      : yookassaBillingConfigured
        ? "Оплата подписки Trainly — через ЮKassa."
        : "Просмотр тарифов доступен; оплата подключается на сервере.";

  return (
    <main className="profile-page flex w-full min-w-0 flex-col gap-4 px-4 py-6 pb-[calc(6rem+max(0.35rem,env(safe-area-inset-bottom,0px)))]">
      <header className="profile-hero">
        <div className="profile-hero-glow" aria-hidden />
        <div className="profile-hero-row">
          <div className="profile-avatar" aria-hidden>
            {initial}
          </div>
          <div className="profile-hero-copy">
            <h1 className="profile-hero-name">{displayName}</h1>
            <p className="profile-hero-sub">Тренерский дневник Trainly</p>
            {specialization.length > 0 || city.length > 0 ? (
              <p className="profile-hero-meta">
                {[specialization, city].filter((s) => s.length > 0).join(" · ")}
              </p>
            ) : null}
            <span className="profile-access-chip">{accessLabel}</span>
          </div>
        </div>
        {trainlyDataMode === "mock" ? (
          <p className="profile-demo-hint">Демо: данные этой вкладки не сохраняются после закрытия браузера.</p>
        ) : null}
      </header>

      <section className="profile-card" aria-labelledby="profile-account-heading">
        <h2 id="profile-account-heading" className="app-section-label">
          Аккаунт
        </h2>
        <div className="profile-menu mt-3">
          <Link href="/profile/setup" prefetch={false} className={menuLink}>
            <span>Настроить профиль</span>
            <MenuArrow />
          </Link>
        </div>
      </section>

      <section className="profile-card" aria-labelledby="profile-billing-heading">
        <h2 id="profile-billing-heading" className="app-section-label">
          Подписка
        </h2>
        <p className="profile-card-lead">{billingHint}</p>
        <div className="profile-menu mt-3">
          <Link href="/billing/plans" prefetch={false} className={menuLink}>
            <span>Тарифы</span>
            <MenuArrow />
          </Link>
          <Link href="/billing/manage" prefetch={false} className={menuLink}>
            <span>Управление подпиской</span>
            <MenuArrow />
          </Link>
          <Link href="/billing/history" prefetch={false} className={menuLink}>
            <span>История оплат</span>
            <MenuArrow />
          </Link>
        </div>
      </section>

      <section className="profile-card" aria-labelledby="profile-privacy-heading">
        <h2 id="profile-privacy-heading" className="app-section-label">
          Данные
        </h2>
        <div className="profile-menu mt-3">
          <Link href="/privacy" prefetch={false} className={menuLink}>
            <span>Центр приватности</span>
            <MenuArrow />
          </Link>
          <Link href="/account/delete" prefetch={false} className={menuLinkDanger}>
            <span>Удалить аккаунт</span>
            <MenuArrow />
          </Link>
        </div>
      </section>

      <section className="profile-card profile-card--docs">
        <button
          type="button"
          className="profile-docs-toggle"
          aria-expanded={docsOpen}
          onClick={() => setDocsOpen((v) => !v)}
        >
          <span className="app-section-label mb-0">Документы</span>
          <span className="profile-docs-chevron" data-open={docsOpen ? "true" : "false"} aria-hidden>
            ▾
          </span>
        </button>
        {docsOpen ? (
          <nav className="profile-menu mt-3" aria-label="Юридические документы">
            <Link href="/legal/terms" prefetch={false} className={menuLink}>
              <span>Пользовательское соглашение</span>
              <MenuArrow />
            </Link>
            <Link href="/legal/privacy" prefetch={false} className={menuLink}>
              <span>Политика ПДн</span>
              <MenuArrow />
            </Link>
            <Link href="/legal/personal-data-consent" prefetch={false} className={menuLink}>
              <span>Согласие на обработку ПДн</span>
              <MenuArrow />
            </Link>
            <Link href="/legal/offer" prefetch={false} className={menuLink}>
              <span>Оферта</span>
              <MenuArrow />
            </Link>
            <Link href="/legal/tariffs" prefetch={false} className={menuLink}>
              <span>Тарифы (юр.)</span>
              <MenuArrow />
            </Link>
            <Link href="/legal/refund" prefetch={false} className={menuLink}>
              <span>Оплата и возврат</span>
              <MenuArrow />
            </Link>
            <Link href="/legal/client-data" prefetch={false} className={menuLink}>
              <span>Данные клиентов</span>
              <MenuArrow />
            </Link>
          </nav>
        ) : null}
      </section>

      <section className="profile-card" aria-labelledby="profile-support-heading">
        <h2 id="profile-support-heading" className="app-section-label">
          Помощь
        </h2>
        <div className="profile-menu mt-3">
          <Link href="/support" prefetch={false} className={menuLink}>
            <span>Поддержка</span>
            <MenuArrow />
          </Link>
        </div>
      </section>

      <footer className="profile-footer">
        <button
          type="button"
          className="app-btn w-full rounded-2xl border border-transparent py-2.5 text-sm font-semibold text-[var(--tg-muted)]"
          onClick={() => void resetMockLifecycle()}
        >
          {trainlyDataMode === "mock" ? "Сбросить демо и выйти" : "Выйти из аккаунта"}
        </button>
      </footer>
    </main>
  );
}
