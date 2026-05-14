"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, type ReactElement } from "react";
import { enterDevTrainerSessionAction } from "@/app/actions/trainly";
import { ShellMain } from "@/components/prod-shell/ShellMain";
import { TrainlyNavAnchor } from "@/components/navigation/TrainlyNavAnchor";
import { useMockApp } from "@/lib/mock/MockAppProvider";

const linkCls =
  "font-medium text-[var(--brand-solid)] underline decoration-[color:color-mix(in_srgb,var(--brand-solid),transparent_40%)] underline-offset-2";

export interface AuthPageContentProps {
  returnTo: string | null;
  hasSession: boolean;
  showDevPostgresLogin: boolean;
  /** Режим postgres без JWT: «демо» только в памяти, без cookie — middleware не пустит в /clients. */
  postgresNoSession: boolean;
  devSecretConfigured: boolean;
}

export function AuthPageContent({
  returnTo,
  hasSession,
  showDevPostgresLogin,
  postgresNoSession,
  devSecretConfigured,
}: AuthPageContentProps): ReactElement {
  const router = useRouter();
  const { enterDemoAuth } = useMockApp();

  const overviewSkipHref = returnTo ?? "/overview";

  const onContinueDemo = async (): Promise<void> => {
    await Promise.resolve(enterDemoAuth());
    router.push("/legal-consent");
  };

  const onDevPostgresLogin = useCallback(async (): Promise<void> => {
    const res = await enterDevTrainerSessionAction();
    if (!res.ok) return;
    const dest = returnTo ?? "/overview";
    router.refresh();
    router.push(dest);
  }, [returnTo, router]);

  return (
    <ShellMain>
      {hasSession ? (
        <div className="rounded-2xl border border-[color:var(--border-soft)] bg-[color:color-mix(in_srgb,var(--bg-card),transparent_12%)] p-3 text-sm text-[var(--text-secondary)]">
          <p className="font-medium text-[var(--text-primary)]">Сессия уже активна.</p>
          <TrainlyNavAnchor
            href={overviewSkipHref}
            className="app-btn mt-2 inline-flex w-full min-h-[44px] items-center justify-center rounded-xl bg-[var(--tg-accent)] px-3 py-2.5 text-center text-sm font-semibold text-white shadow-app-primary"
          >
            Перейти в приложение
          </TrainlyNavAnchor>
        </div>
      ) : null}

      <TrainlyNavAnchor
        href={hasSession ? "/profile" : "/welcome"}
        className="inline-flex min-h-[44px] max-w-full items-center text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        <span aria-hidden className="mr-1.5 shrink-0">
          ←
        </span>
        {hasSession ? "Назад в профиль" : "Назад на приветствие"}
      </TrainlyNavAnchor>

      <header className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">Trainly</h1>
        <p className="text-base font-medium text-[var(--text-secondary)]">Тренерский дневник в Telegram</p>
      </header>

      <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
        Клиенты, тренировки, график, оплаты и заметки — в одном месте.
      </p>

      <p className="rounded-xl border border-[color:var(--border-soft)] bg-[color:color-mix(in_srgb,var(--bg-card),transparent_20%)] p-3 text-xs leading-relaxed text-[var(--text-secondary)]">
        <span className="font-semibold text-[var(--text-primary)]">Вне Telegram:</span> в production вход — только через
        Telegram Mini App (подпись <span className="font-mono text-[11px]">initData</span>). Обычная ссылка в браузере
        сама по себе не авторизует. Откройте Trainly из бота; в dev с PostgreSQL можно использовать «Dev: войти».
      </p>

      <div className="premium-surface flex flex-col gap-3 p-4">
        <button
          type="button"
          disabled
          className="app-btn w-full cursor-not-allowed rounded-2xl bg-[var(--tg-accent)] px-4 py-3.5 text-center text-[15px] font-semibold text-white opacity-40 shadow-app-primary"
          title="Вход через Telegram будет подключён на сервере"
        >
          Войти через Telegram
        </button>
        <p className="text-center text-xs leading-relaxed text-[var(--tg-muted)]">
          В продакшене вход будет выполняться через Telegram Mini App.
        </p>
        {postgresNoSession ? (
          <p className="text-center text-xs leading-relaxed text-[var(--tg-muted)]">
            Включён <span className="font-mono text-[11px]">DATABASE_URL</span>: без cookie-сессии middleware не пускает в клиенты и обзор. «Продолжить в демо» только обновляет локальное демо в памяти и{" "}
            <span className="font-semibold text-[var(--text-secondary)]">не создаёт вход в БД</span>.
            {showDevPostgresLogin ? " Нажмите «Dev: войти» выше." : null}
          </p>
        ) : null}
        {showDevPostgresLogin ? (
          <button
            type="button"
            onClick={() => void onDevPostgresLogin()}
            className="app-btn w-full rounded-2xl border border-[color:var(--border-strong)] bg-[color:color-mix(in_srgb,var(--bg-page),transparent_30%)] px-4 py-3.5 text-center text-[15px] font-semibold text-[var(--text-primary)]"
          >
            Dev: войти (PostgreSQL + cookie)
          </button>
        ) : null}
        {postgresNoSession && process.env.NODE_ENV !== "production" && !devSecretConfigured ? (
          <p className="rounded-xl border border-[color:color-mix(in_srgb,var(--warning),transparent_45%)] bg-[color:color-mix(in_srgb,var(--warning),transparent_88%)] px-3 py-2 text-center text-xs leading-relaxed text-[var(--text-primary)]">
            Нет <span className="font-mono">TRAINLY_DEV_AUTH_SECRET</span> в <span className="font-mono">.env.local</span> — кнопка dev-входа скрыта. Задайте секрет и перезапустите dev, либо уберите{" "}
            <span className="font-mono">DATABASE_URL</span> для полностью локального mock.
          </p>
        ) : null}
        {!postgresNoSession ? (
          <button
            type="button"
            onClick={() => void onContinueDemo()}
            className="app-btn w-full rounded-2xl bg-[var(--tg-accent)] px-4 py-3.5 text-center text-[15px] font-semibold text-white shadow-app-primary"
          >
            Продолжить в демо
          </button>
        ) : null}
        {!postgresNoSession ? (
          <TrainlyNavAnchor
            href={overviewSkipHref}
            className="block text-center text-xs font-medium text-[var(--tg-muted)] underline decoration-[color:var(--border-strong)] underline-offset-2 hover:text-[var(--text-secondary)]"
          >
            В обзор без пошагового демо-пути
          </TrainlyNavAnchor>
        ) : null}
      </div>

      <p className="text-center text-xs text-[var(--tg-muted)]">
        <Link href="/legal/terms" prefetch={false} className={linkCls}>
          Пользовательское соглашение
        </Link>
        <span className="mx-2 text-[var(--border-strong)]">·</span>
        <Link href="/legal/privacy" prefetch={false} className={linkCls}>
          Политика ПДн
        </Link>
      </p>
    </ShellMain>
  );
}
