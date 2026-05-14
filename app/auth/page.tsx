import type { ReactElement } from "react";
import { getTrainerSession } from "@/lib/auth/session";
import { getTrainlyDataSource } from "@/lib/config/dataSource";
import { isTelegramMiniAppAuthConfigured } from "@/lib/config/telegramAuthAvailability";
import { AuthPageContent } from "@/components/auth/AuthPageContent";
import { sanitizeReturnTo } from "@/lib/navigation/sanitizeReturnTo";

interface AuthPageProps {
  searchParams?: Promise<{ returnTo?: string | string[] }>;
}

export default async function AuthPage({ searchParams }: AuthPageProps): Promise<ReactElement> {
  const sp = searchParams != null ? await searchParams : {};
  const raw = sp.returnTo;
  const returnTo = sanitizeReturnTo(Array.isArray(raw) ? raw[0] : raw);

  const session = await getTrainerSession();
  const hasSession = session != null;

  let dataSource: ReturnType<typeof getTrainlyDataSource> | "error" = "mock";
  try {
    dataSource = getTrainlyDataSource();
  } catch {
    dataSource = "error";
  }

  const devSecretConfigured = (process.env.TRAINLY_DEV_AUTH_SECRET?.length ?? 0) > 0;
  const telegramLoginConfigured = isTelegramMiniAppAuthConfigured();

  const showDevPostgresLogin =
    process.env.NODE_ENV !== "production" && dataSource === "postgres" && !hasSession && devSecretConfigured;

  const postgresNoSession = dataSource === "postgres" && !hasSession;

  return (
    <AuthPageContent
      returnTo={returnTo}
      hasSession={hasSession}
      showDevPostgresLogin={showDevPostgresLogin}
      postgresNoSession={postgresNoSession}
      devSecretConfigured={devSecretConfigured}
      telegramLoginConfigured={telegramLoginConfigured}
    />
  );
}
