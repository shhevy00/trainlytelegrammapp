import Link from "next/link";
import type { ReactElement } from "react";
import { PageHeader } from "@/components/prod-shell/PageHeader";
import { ShellMain } from "@/components/prod-shell/ShellMain";

export default function AuthErrorPage(): ReactElement {
  return (
    <ShellMain>
      <PageHeader title="Не удалось войти" backHref="/auth" backLabel="К экрану входа" />

      <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
        Ссылка устарела или вход не был подтверждён.
      </p>

      <Link
        href="/auth"
        prefetch={false}
        className="app-btn inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl bg-[var(--tg-accent)] px-4 py-3.5 text-center text-[15px] font-semibold text-white shadow-app-primary"
      >
        Повторить вход
      </Link>

      <Link
        href="/support"
        prefetch={false}
        className="app-btn inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-4 py-3 text-center text-sm font-semibold text-[var(--text-primary)]"
      >
        Поддержка
      </Link>
    </ShellMain>
  );
}
