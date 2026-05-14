"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, type ReactElement } from "react";
import { enterDevTrainerSessionAction } from "@/app/actions/trainly";
import { ShellMain } from "@/components/prod-shell/ShellMain";
import { TrainlyNavAnchor } from "@/components/navigation/TrainlyNavAnchor";
import { TelegramAutoLogin } from "@/components/telegram/TelegramAutoLogin";
import { useMockApp } from "@/lib/mock/MockAppProvider";
import { postTelegramWebAppAuth } from "@/lib/telegram/clientAuth";

const linkCls =
  "font-medium text-[var(--brand-solid)] underline decoration-[color:color-mix(in_srgb,var(--brand-solid),transparent_40%)] underline-offset-2";

export interface AuthPageContentProps {
  returnTo: string | null;
  hasSession: boolean;
  showDevPostgresLogin: boolean;
  /** Режим postgres без JWT: «демо» только в памяти, без cookie — edge proxy не пустит в /clients. */
  postgresNoSession: boolean;
  /** PostgreSQL + TELEGRAM_BOT_TOKEN: доступен вход через Mini App. */
  telegramLoginConfigured: boolean;
}

export function AuthPageContent({
  returnTo,
  hasSession,
  showDevPostgresLogin,
  postgresNoSession,
  telegramLoginConfigured,
}: AuthPageContentProps): ReactElement {
  const router = useRouter();
  const { enterDemoAuth } = useMockApp();
  const [telegramBusy, setTelegramBusy] = useState(false);
  const [telegramManualError, setTelegramManualError] = useState<string | null>(null);

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

  const onTelegramLogin = useCallback(async (): Promise<void> => {
    const initData = window.Telegram?.WebApp?.initData;
    if (typeof initData !== "string" || initData.length === 0) {
      setTelegramManualError("Откройте приложение из Telegram (кнопка или меню у бота).");
      return;
    }
    setTelegramManualError(null);
    setTelegramBusy(true);
    try {
      const res = await postTelegramWebAppAuth(initData);
      if (!res.ok) {
        setTelegramManualError(
          res.error === "timeout"
            ? "Сервер не ответил вовремя. Проверьте сеть и попробуйте снова."
            : res.error === "network"
              ? "Не удалось связаться с сервером. Попробуйте снова."
              : res.error,
        );
        return;
      }
      const dest = returnTo ?? "/overview";
      router.refresh();
      router.push(dest);
    } finally {
      setTelegramBusy(false);
    }
  }, [returnTo, router]);

  return (
    <ShellMain>
      <TelegramAutoLogin
        hasSession={hasSession}
        telegramLoginConfigured={telegramLoginConfigured}
        returnTo={returnTo}
      />
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

      <div className="premium-surface flex flex-col gap-3 p-4">
        <button
          type="button"
          disabled={!telegramLoginConfigured || telegramBusy || hasSession}
          onClick={() => void onTelegramLogin()}
          className="app-btn w-full rounded-2xl bg-[var(--tg-accent)] px-4 py-3.5 text-center text-[15px] font-semibold text-white shadow-app-primary disabled:cursor-not-allowed disabled:opacity-40"
          title={!telegramLoginConfigured ? "Сервер ещё не настроен для входа через Telegram" : undefined}
        >
          {telegramBusy ? "Входим…" : "Войти через Telegram"}
        </button>
        {telegramManualError != null && telegramManualError.length > 0 ? (
          <p className="text-center text-xs leading-relaxed text-[var(--text-primary)]">
            Ошибка входа: <span className="font-mono">{telegramManualError}</span>
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
