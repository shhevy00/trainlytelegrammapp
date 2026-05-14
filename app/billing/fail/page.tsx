import Link from "next/link";
import type { ReactElement } from "react";
import { PageHeader } from "@/components/prod-shell/PageHeader";
import { ShellMain } from "@/components/prod-shell/ShellMain";

export default function BillingFailPage(): ReactElement {
  return (
    <ShellMain>
      <PageHeader title="Оплата не прошла" backHref="/billing/plans" backLabel="К тарифам" />

      <p className="text-sm leading-relaxed text-[var(--text-secondary)]">Платёж не был завершён.</p>

      <Link
        href="/billing/plans"
        prefetch={false}
        className="app-btn inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl bg-[var(--tg-accent)] px-4 py-3.5 text-center text-[15px] font-semibold text-white shadow-app-primary"
      >
        Повторить
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
