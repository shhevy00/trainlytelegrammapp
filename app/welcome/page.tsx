import type { ReactElement } from "react";
import { TelegramAutoLogin } from "@/components/telegram/TelegramAutoLogin";
import { WelcomePageContent } from "@/components/welcome/WelcomePageContent";
import { welcomeCtaGhost, welcomeCtaPrimary, welcomeCtaSecondary } from "@/components/welcome/welcomeCtaClasses";
import { getTrainerSession } from "@/lib/auth/session";
import { isTelegramMiniAppAuthConfigured } from "@/lib/config/telegramAuthAvailability";
import { getTrainlyDataSource } from "@/lib/config/dataSource";

function authHref(returnTo: string): string {
  const q = new URLSearchParams({ returnTo });
  return `/auth?${q.toString()}`;
}

/**
 * С `DATABASE_URL` и без JWT edge proxy не пускает на /overview — ссылки ведут на /auth с returnTo.
 * В mock-режиме — прямые ссылки в приложение.
 */
export default async function WelcomePage(): Promise<ReactElement> {
  let dataSource: ReturnType<typeof getTrainlyDataSource> | "error" = "mock";
  try {
    dataSource = getTrainlyDataSource();
  } catch {
    dataSource = "error";
  }

  const session = await getTrainerSession();
  const telegramLoginConfigured = isTelegramMiniAppAuthConfigured();
  const gateAuth =
    (dataSource === "postgres" && session == null) || dataSource === "error";

  const primaryHref = gateAuth ? authHref("/overview") : "/overview";
  const secondaryHref = gateAuth ? authHref("/clients/new") : "/clients/new";
  const tertiaryHref = gateAuth ? authHref("/overview") : "/overview";

  const primaryLabel = gateAuth ? "Войти и начать работу" : "Начать работу";
  const secondaryLabel = gateAuth ? "Войти и добавить клиента" : "Добавить первого клиента";
  const tertiaryLabel = gateAuth ? "Войти (пропустить описание)" : "Пропустить";

  return (
    <main className="flex min-w-0 w-full flex-col gap-4 px-4 py-6 pb-[calc(6rem+max(0.35rem,env(safe-area-inset-bottom,0px)))]">
      <TelegramAutoLogin
        hasSession={session != null}
        telegramLoginConfigured={telegramLoginConfigured}
        returnTo="/overview"
      />
      <WelcomePageContent />
      <div className="mt-2 flex flex-col gap-2">
        <a href={primaryHref} className={welcomeCtaPrimary}>
          {primaryLabel}
        </a>
        <a href={secondaryHref} className={welcomeCtaSecondary}>
          {secondaryLabel}
        </a>
        <a href={tertiaryHref} className={welcomeCtaGhost}>
          {tertiaryLabel}
        </a>
      </div>
    </main>
  );
}
