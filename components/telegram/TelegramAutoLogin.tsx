"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactElement } from "react";
import { postTelegramWebAppAuth } from "@/lib/telegram/clientAuth";

export interface TelegramAutoLoginProps {
  hasSession: boolean;
  telegramLoginConfigured: boolean;
  returnTo?: string | null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForTelegramInitData(maxMs: number, stepMs: number): Promise<string | null> {
  const steps = Math.max(1, Math.ceil(maxMs / stepMs));
  for (let i = 0; i < steps; i++) {
    const raw = window.Telegram?.WebApp?.initData;
    if (typeof raw === "string" && raw.length > 0) return raw;
    await sleep(stepMs);
  }
  return null;
}

/**
 * В Mini App с PostgreSQL и настроенным ботом: ждёт SDK, отправляет initData на сервер, редирект после успеха.
 */
export function TelegramAutoLogin({
  hasSession,
  telegramLoginConfigured,
  returnTo,
}: TelegramAutoLoginProps): ReactElement | null {
  const router = useRouter();
  const effectGen = useRef(0);
  const [banner, setBanner] = useState<"signing_in" | "error" | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    if (hasSession || !telegramLoginConfigured) return;

    const myGen = ++effectGen.current;
    let cancelled = false;

    void (async (): Promise<void> => {
      const initData = await waitForTelegramInitData(12_000, 50);
      if (cancelled || myGen !== effectGen.current || initData == null) return;

      setBanner("signing_in");
      setErrorDetail(null);

      const result = await postTelegramWebAppAuth(initData);
      if (cancelled || myGen !== effectGen.current) return;

      if (!result.ok) {
        setBanner("error");
        const detail =
          result.error === "timeout"
            ? "таймаут сети"
            : result.error === "network"
              ? "сеть"
              : result.error;
        setErrorDetail(detail);
        return;
      }

      const dest = returnTo != null && returnTo.length > 0 ? returnTo : "/overview";
      router.replace(dest);
      router.refresh();
    })();

    return () => {
      cancelled = true;
    };
  }, [hasSession, telegramLoginConfigured, returnTo, router]);

  if (!telegramLoginConfigured || hasSession) return null;
  if (banner == null) return null;

  if (banner === "signing_in") {
    return (
      <p className="rounded-xl border border-[color:var(--border-soft)] bg-[color:color-mix(in_srgb,var(--bg-card),transparent_20%)] px-3 py-2 text-center text-xs leading-relaxed text-[var(--text-secondary)]">
        Вход через Telegram…
      </p>
    );
  }

  return (
    <p className="rounded-xl border border-[color:color-mix(in_srgb,var(--warning),transparent_45%)] bg-[color:color-mix(in_srgb,var(--warning),transparent_88%)] px-3 py-2 text-center text-xs leading-relaxed text-[var(--text-primary)]">
      Не удалось войти через Telegram{errorDetail != null && errorDetail.length > 0 ? ` (${errorDetail})` : ""}. Попробуйте
      обновить страницу или откройте приложение из бота ещё раз.
    </p>
  );
}
