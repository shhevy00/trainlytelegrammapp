"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import type { TrainlyDataSource } from "@/lib/config/dataSource";
import { mockTrainer } from "@/lib/mock/data";
import { subscriptionStatusLabelRu } from "@/lib/mock/lifecycleTypes";
import { useMockApp } from "@/lib/mock/MockAppProvider";

const sectionCard =
  "rounded-2xl border border-[color:var(--border-soft)] bg-[var(--tg-card)] p-4";

const docLink =
  "app-btn flex min-h-[44px] w-full items-center justify-between gap-3 rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3 py-3 text-left text-sm font-medium text-[var(--text-primary)] transition hover:border-[color:color-mix(in_srgb,var(--brand-solid),transparent_55%)]";

const rowMuted =
  "flex min-h-[44px] w-full items-center justify-between gap-3 rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3 py-3 text-left text-sm text-[var(--text-primary)] opacity-60";

function lifecycleRow(label: string, value: string): ReactElement {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <dt className="shrink-0 text-[var(--tg-muted)]">{label}</dt>
      <dd className="min-w-0 break-words text-right font-medium text-[var(--text-primary)]">{value}</dd>
    </div>
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
  const { aiCreditsTotal, aiCreditsUsed, mockLifecycle, resetMockLifecycle } = useMockApp();
  const remaining = Math.max(0, aiCreditsTotal - aiCreditsUsed);
  const displayName =
    mockLifecycle.trainerProfile?.displayName.trim() || mockTrainer.firstName.trim() || "Тренер";

  const authLabel =
    mockLifecycle.mockAuthStatus === "authenticated"
      ? "Telegram"
      : mockLifecycle.mockAuthStatus === "authenticated_demo"
        ? "демо"
        : "не выполнен";
  const legalLabel = mockLifecycle.mockLegalStatus === "accepted" ? "приняты" : "не приняты";
  const profileLabel = mockLifecycle.mockProfileSetupStatus === "completed" ? "заполнен" : "не заполнен";
  const onboardLabel = mockLifecycle.mockOnboardingStatus === "seen" ? "пройдено" : "не пройдено";
  const accessLabel = subscriptionStatusLabelRu(mockLifecycle.mockSubscriptionStatus);

  return (
    <main className="flex w-full min-w-0 flex-col gap-5 px-4 py-6 pb-[calc(6rem+max(0.35rem,env(safe-area-inset-bottom,0px)))]">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">{displayName}</h1>
        <p className="text-sm font-medium text-[var(--text-secondary)]">Тренерский дневник</p>
        {trainlyDataMode === "mock" ? (
          <p className="text-xs text-[var(--tg-muted)]">
            Демо: данные в памяти этой вкладки; после закрытия браузера не сохраняются.
          </p>
        ) : (
          <p className="text-xs text-[var(--tg-muted)]">
            Клиенты, тренировки и график хранятся в защищённой базе Trainly.
          </p>
        )}
      </header>

      <section className={sectionCard} aria-labelledby="profile-lifecycle">
        <h2 id="profile-lifecycle" className="app-section-label">
          Статус запуска
        </h2>
        <dl className="mt-3 flex flex-col gap-2">
          {lifecycleRow("Вход", authLabel)}
          {lifecycleRow("Условия", legalLabel)}
          {lifecycleRow("Профиль", profileLabel)}
          {lifecycleRow("Обучение", onboardLabel)}
          {lifecycleRow("Доступ", accessLabel)}
        </dl>
        <div className="mt-3 flex flex-col gap-2">
          <Link
            href="/auth"
            prefetch={false}
            className="app-btn flex min-h-[44px] w-full items-center justify-center rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] py-3 text-center text-sm font-semibold text-[var(--text-primary)]"
          >
            Пройти путь сначала
          </Link>
          <button
            type="button"
            onClick={() => void resetMockLifecycle()}
            className="app-btn flex min-h-[44px] w-full items-center justify-center rounded-2xl border border-[color:color-mix(in_srgb,var(--danger),transparent_55%)] bg-[color:color-mix(in_srgb,var(--danger),transparent_92%)] py-3 text-center text-sm font-semibold text-[var(--danger)]"
          >
            {trainlyDataMode === "mock" ? "Сбросить демо-путь" : "Выйти из аккаунта"}
          </button>
        </div>
      </section>

      <section className={sectionCard} aria-labelledby="profile-account">
        <h2 id="profile-account" className="app-section-label">
          Аккаунт
        </h2>
        <dl className="mt-3 flex flex-col gap-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--tg-muted)]">Имя тренера</dt>
            <dd className="min-w-0 truncate font-medium text-[var(--text-primary)]">{displayName}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--tg-muted)]">Telegram</dt>
            <dd className="min-w-0 text-right text-[var(--text-secondary)]">
              {mockLifecycle.mockAuthStatus === "authenticated" ? "привязан" : "будет подключён позже"}
            </dd>
          </div>
        </dl>
        <Link
          href="/profile/setup"
          prefetch={false}
          className="app-btn mt-3 flex min-h-[44px] w-full items-center justify-center rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] py-3 text-center text-sm font-semibold text-[var(--text-primary)]"
        >
          Настроить профиль
        </Link>
        <div className={rowMuted} aria-disabled>
          <span>Уведомления</span>
          <span className="shrink-0 text-xs text-[var(--tg-muted)]">позже</span>
        </div>
      </section>

      <section className={sectionCard} aria-labelledby="profile-access">
        <h2 id="profile-access" className="app-section-label">
          Доступ и подписка
        </h2>
        <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
          {trainlyDataMode === "mock" ? "Текущий режим: демо" : "Доступ Trainly"} · {accessLabel}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-[var(--tg-muted)]">
          {trainlyDataMode === "mock"
            ? "Оплата доступа к Trainly пока не подключена — интерфейс тарифов и подписки подготовлен для следующего этапа."
            : yookassaBillingConfigured
              ? "Оплата подписки Trainly — через ЮKassa. Оплаты занятий клиентами ведите отдельно в разделе «Оплата занятий»."
              : "Платёжный модуль ЮKassa на сервере не настроен: доступен просмотр тарифов; реальная оплата подключится позже."}
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <Link href="/billing/plans" prefetch={false} className={docLink}>
            <span>Тарифы</span>
            <span aria-hidden className="text-[var(--tg-muted)]">
              →
            </span>
          </Link>
          <Link href="/billing/manage" prefetch={false} className={docLink}>
            <span>Управление подпиской</span>
            <span aria-hidden className="text-[var(--tg-muted)]">
              →
            </span>
          </Link>
          <Link href="/billing/history" prefetch={false} className={docLink}>
            <span>История оплат</span>
            <span aria-hidden className="text-[var(--tg-muted)]">
              →
            </span>
          </Link>
        </div>
        <Link
          href="/auth"
          prefetch={false}
          className="app-btn mt-3 flex min-h-[44px] w-full items-center justify-center rounded-2xl bg-[color:color-mix(in_srgb,var(--tg-bg),transparent_20%)] py-3 text-center text-xs font-medium text-[var(--text-secondary)] ring-1 ring-[color:var(--border-soft)]"
        >
          Экран входа
        </Link>
      </section>

      <section className={sectionCard} aria-labelledby="profile-ai">
        <h2 id="profile-ai" className="app-section-label">
          Подсказки перед тренировкой
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
          Короткие формулировки для себя или сообщения клиенту. В интерфейсе это демонстрация без реальной нейросети.
        </p>
        <p className="mt-3 text-sm text-[var(--tg-muted)]">
          {trainlyDataMode === "mock" ? (
            <>
              Осталось{" "}
              <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                {remaining} из {aiCreditsTotal}
              </span>{" "}
              подсказок в демо, использовано {aiCreditsUsed}.
            </>
          ) : (
            <>
              Лимит по тарифу на сервере:{" "}
              <span className="font-semibold tabular-nums text-[var(--text-primary)]">{aiCreditsTotal}</span>, доступно{" "}
              <span className="font-semibold tabular-nums text-[var(--text-primary)]">{remaining}</span>, израсходовано
              в этой сессии: {aiCreditsUsed}.
            </>
          )}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-[var(--tg-muted)]">
          Подсказки не заменяют вашу экспертизу и не влияют на оплату занятий клиентом.
        </p>
      </section>

      <section className={sectionCard} aria-labelledby="profile-privacy">
        <h2 id="profile-privacy" className="app-section-label">
          Данные и приватность
        </h2>
        <div className="mt-3 flex flex-col gap-2">
          <Link href="/privacy" prefetch={false} className={docLink}>
            <span>Центр приватности</span>
            <span aria-hidden className="text-[var(--tg-muted)]">
              →
            </span>
          </Link>
          <Link href="/account/delete" prefetch={false} className={docLink}>
            <span>Удалить аккаунт</span>
            <span aria-hidden className="text-[var(--tg-muted)]">
              →
            </span>
          </Link>
        </div>
      </section>

      <section className={sectionCard} aria-labelledby="profile-docs">
        <h2 id="profile-docs" className="app-section-label">
          Документы
        </h2>
        <nav className="mt-3 flex flex-col gap-2" aria-label="Юридические документы">
          <Link href="/legal/terms" prefetch={false} className={docLink}>
            Пользовательское соглашение
          </Link>
          <Link href="/legal/privacy" prefetch={false} className={docLink}>
            Политика ПДн
          </Link>
          <Link href="/legal/personal-data-consent" prefetch={false} className={docLink}>
            Согласие на обработку ПДн
          </Link>
          <Link href="/legal/offer" prefetch={false} className={docLink}>
            Оферта
          </Link>
          <Link href="/legal/tariffs" prefetch={false} className={docLink}>
            Тарифы
          </Link>
          <Link href="/legal/refund" prefetch={false} className={docLink}>
            Оплата и возврат
          </Link>
          <Link href="/legal/client-data" prefetch={false} className={docLink}>
            Правила данных клиентов
          </Link>
          <Link href="/legal-consent" prefetch={false} className={docLink}>
            {trainlyDataMode === "mock" ? "Экран согласий (демо)" : "Экран согласий"}
          </Link>
        </nav>
      </section>

      <section className={sectionCard} aria-labelledby="profile-support">
        <h2 id="profile-support" className="app-section-label">
          Поддержка
        </h2>
        <div className="mt-3 flex flex-col gap-2">
          <Link
            href="/welcome"
            prefetch={false}
            className="app-btn inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl bg-[var(--tg-accent)] px-4 py-3 text-center text-sm font-semibold text-white shadow-app-primary"
          >
            Как работает Trainly
          </Link>
          <Link href="/support" prefetch={false} className={docLink}>
            <span>Поддержка</span>
            <span aria-hidden className="text-[var(--tg-muted)]">
              →
            </span>
          </Link>
        </div>
        <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 marker:text-[var(--tg-muted)]">
          <li className="text-sm leading-relaxed text-[var(--tg-text)]">Это приложение для тренера, не для клиента.</li>
          <li className="text-sm leading-relaxed text-[var(--tg-text)]">
            Оплата клиентов за занятия — отдельно от доступа к Trainly.
          </li>
          <li className="text-sm leading-relaxed text-[var(--tg-text)]">
            Шаблоны тренировки — это структура записи, не готовая программа.
          </li>
        </ul>
      </section>

      <Link
        href="/overview"
        prefetch={false}
        className="app-btn rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] py-3 text-center text-sm font-semibold text-[var(--text-primary)]"
      >
        Назад в обзор
      </Link>
    </main>
  );
}
