"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent, type ReactElement } from "react";
import { PageHeader } from "@/components/prod-shell/PageHeader";
import { ShellMain } from "@/components/prod-shell/ShellMain";
import { useMockApp } from "@/lib/mock/MockAppProvider";

const linkCls = "font-medium text-[var(--brand-solid)] underline decoration-[color:color-mix(in_srgb,var(--brand-solid),transparent_40%)] underline-offset-2";

export function LegalConsentContent(): ReactElement {
  const router = useRouter();
  const { mockLifecycle, acceptLegalMock } = useMockApp();
  const [a1, setA1] = useState(false);
  const [a2, setA2] = useState(false);
  const [a3, setA3] = useState(false);
  const [a4, setA4] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const allRequired = useMemo(() => a1 && a2 && a3 && a4, [a1, a2, a3, a4]);

  const onSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!allRequired) return;
    await Promise.resolve(acceptLegalMock());
    router.push("/profile/setup");
  };

  const row = "flex gap-3 rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-card)] p-3";

  return (
    <ShellMain>
      <PageHeader
        title="Перед началом работы"
        subtitle="Чтобы использовать Trainly, примите условия сервиса."
        backHref="/profile"
      />

      {mockLifecycle.mockLegalStatus === "accepted" ? (
        <p className="rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-card)] px-3 py-2 text-xs leading-relaxed text-[var(--text-secondary)]">
          Условия уже приняты в демо. Вы можете продолжить путь или вернуться в профиль.
        </p>
      ) : null}

      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
        <div className={row}>
          <input
            id="lc-terms"
            type="checkbox"
            checked={a1}
            onChange={(e) => setA1(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 rounded border-[color:var(--border-strong)]"
          />
          <label htmlFor="lc-terms" className="min-w-0 text-sm leading-relaxed text-[var(--tg-text)]">
            Я принимаю Пользовательское соглашение (
            <Link href="/legal/terms" prefetch={false} className={linkCls}>
              открыть
            </Link>
            )
          </label>
        </div>
        <div className={row}>
          <input
            id="lc-privacy"
            type="checkbox"
            checked={a2}
            onChange={(e) => setA2(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 rounded border-[color:var(--border-strong)]"
          />
          <label htmlFor="lc-privacy" className="min-w-0 text-sm leading-relaxed text-[var(--tg-text)]">
            Я ознакомлен с Политикой обработки персональных данных (
            <Link href="/legal/privacy" prefetch={false} className={linkCls}>
              открыть
            </Link>
            )
          </label>
        </div>
        <div className={row}>
          <input
            id="lc-pd"
            type="checkbox"
            checked={a3}
            onChange={(e) => setA3(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 rounded border-[color:var(--border-strong)]"
          />
          <label htmlFor="lc-pd" className="min-w-0 text-sm leading-relaxed text-[var(--tg-text)]">
            Я даю согласие на обработку моих персональных данных (
            <Link href="/legal/personal-data-consent" prefetch={false} className={linkCls}>
              открыть
            </Link>
            )
          </label>
        </div>
        <div className={row}>
          <input
            id="lc-client"
            type="checkbox"
            checked={a4}
            onChange={(e) => setA4(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 rounded border-[color:var(--border-strong)]"
          />
          <label htmlFor="lc-client" className="min-w-0 text-sm leading-relaxed text-[var(--tg-text)]">
            Я понимаю правила внесения данных клиентов (
            <Link href="/legal/client-data" prefetch={false} className={linkCls}>
              открыть
            </Link>
            )
          </label>
        </div>
        <div className={row}>
          <input
            id="lc-mkt"
            type="checkbox"
            checked={marketing}
            onChange={(e) => setMarketing(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 rounded border-[color:var(--border-strong)]"
          />
          <label htmlFor="lc-mkt" className="min-w-0 text-sm leading-relaxed text-[var(--tg-text)]">
            Я хочу получать новости и предложения Trainly
          </label>
        </div>

        <p className="text-xs leading-relaxed text-[var(--tg-muted)]">
          В продакшене факт принятия будет сохраняться на сервере с версией документов.
        </p>

        <button
          type="submit"
          disabled={!allRequired}
          className="app-btn w-full rounded-2xl bg-[var(--tg-accent)] px-4 py-3.5 text-center text-[15px] font-semibold text-white shadow-app-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          Продолжить
        </button>
      </form>
    </ShellMain>
  );
}
