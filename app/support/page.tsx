import Link from "next/link";
import type { ReactElement } from "react";
import { PageHeader } from "@/components/prod-shell/PageHeader";
import { ShellMain } from "@/components/prod-shell/ShellMain";

function supportUrlFromEnv(): string | null {
  const u = process.env.NEXT_PUBLIC_TRAINLY_SUPPORT_URL?.trim();
  if (u == null || u.length === 0) return null;
  try {
    const parsed = new URL(u);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return u;
  } catch {
    return null;
  }
}

export default function SupportPage(): ReactElement {
  const supportUrl = supportUrlFromEnv();

  return (
    <ShellMain>
      <PageHeader title="Поддержка" backHref="/profile" />

      <div className="premium-surface min-w-0 p-4 text-sm text-[var(--text-secondary)]">
        {supportUrl != null ? (
          <p>
            Написать в поддержку:{" "}
            <a
              href={supportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[var(--brand-solid)] underline decoration-[color:color-mix(in_srgb,var(--brand-solid),transparent_40%)] underline-offset-2"
            >
              открыть контакт
            </a>
          </p>
        ) : (
          <>
            <p>
              Контакт поддержки задаётся переменной окружения{" "}
              <span className="font-mono text-[11px] text-[var(--text-primary)]">NEXT_PUBLIC_TRAINLY_SUPPORT_URL</span>{" "}
              (например ссылка на Telegram <span className="font-mono text-[11px]">https://t.me/…</span>). См.{" "}
              <span className="font-mono text-[11px]">.env.example</span>.
            </p>
            <p className="mt-2 text-xs text-[var(--tg-muted)]">
              Пока ссылка не задана, используйте раздел документов и экран «Как работает Trainly».
            </p>
          </>
        )}
      </div>

      <Link
        href="/welcome"
        prefetch={false}
        className="app-btn block w-full rounded-2xl bg-[var(--tg-accent)] px-4 py-3 text-center text-sm font-semibold text-white shadow-app-primary"
      >
        Как работает Trainly
      </Link>

      <Link
        href="/legal/terms"
        prefetch={false}
        className="app-btn block w-full rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] py-3 text-center text-sm font-semibold text-[var(--text-primary)]"
      >
        Документы: пользовательское соглашение
      </Link>
    </ShellMain>
  );
}
