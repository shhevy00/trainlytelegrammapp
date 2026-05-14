"use client";

import { useEffect, type ReactElement } from "react";

const TELEGRAM_WEB_APP_SRC = "https://telegram.org/js/telegram-web-app.js";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        /** Bot API / Mini App 7.7+ */
        isVersionAtLeast?: (version: string) => boolean;
        disableVerticalSwipes?: () => void;
        setHeaderColor?: (color: string) => void;
        themeParams?: { bg_color?: string };
      };
    };
  }
}

function initTelegramWebApp(): void {
  const w = window.Telegram?.WebApp;
  if (w == null) return;
  try {
    w.ready();
    w.expand();
    const bg = w.themeParams?.bg_color;
    if (typeof bg === "string" && bg.length > 0 && typeof w.setHeaderColor === "function") {
      w.setHeaderColor(bg);
    }
    // Иначе SDK пишет в консоль: "Changing swipes behavior is not supported in version 6.0"
    if (
      typeof w.disableVerticalSwipes === "function" &&
      typeof w.isVersionAtLeast === "function" &&
      w.isVersionAtLeast("7.7")
    ) {
      w.disableVerticalSwipes();
    }
  } catch {
    /* WebView без полного API */
  }
}

/**
 * Telegram Mini App: SDK грузим только после mount (не через next/script),
 * чтобы WebView не менял DOM до гидрации React. ready/expand — после появления WebApp.
 */
export function TelegramMiniAppBootstrap(): ReactElement | null {
  useEffect(() => {
    if (window.Telegram?.WebApp != null) {
      initTelegramWebApp();
      return;
    }

    let canceled = false;

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${TELEGRAM_WEB_APP_SRC}"]`);
    if (existing != null) {
      const onLoad = (): void => {
        if (!canceled) initTelegramWebApp();
      };
      if (window.Telegram?.WebApp != null || existing.dataset.loaded === "1") {
        onLoad();
        return () => {
          canceled = true;
        };
      }
      existing.addEventListener("load", onLoad);
      return () => {
        canceled = true;
        existing.removeEventListener("load", onLoad);
      };
    }

    const script = document.createElement("script");
    script.src = TELEGRAM_WEB_APP_SRC;
    script.async = true;
    script.addEventListener("load", () => {
      script.dataset.loaded = "1";
      if (!canceled) initTelegramWebApp();
    });
    document.head.appendChild(script);

    return () => {
      canceled = true;
    };
  }, []);

  return null;
}
