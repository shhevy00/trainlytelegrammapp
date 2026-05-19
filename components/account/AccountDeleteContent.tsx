"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactElement } from "react";
import { trainlyDeleteAccountAction } from "@/app/actions/trainly";
import { PageHeader } from "@/components/prod-shell/PageHeader";
import { ShellMain } from "@/components/prod-shell/ShellMain";

export function AccountDeleteContent(): ReactElement {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onDelete = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    const res = await trainlyDeleteAccountAction(confirmPhrase);
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.replace("/welcome");
  };

  return (
    <ShellMain>
      <PageHeader title="Удалить аккаунт?" backHref="/privacy" backLabel="Отмена" />

      <div className="premium-surface min-w-0 p-4 text-sm leading-relaxed text-[var(--text-secondary)]">
        <p className="font-semibold text-[var(--danger)]">Это действие нельзя отменить.</p>
        <p className="mt-3 font-medium text-[var(--text-primary)]">Будут удалены:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-[var(--tg-muted)]">
          <li>профиль тренера;</li>
          <li>клиенты;</li>
          <li>тренировки;</li>
          <li>шаблоны;</li>
          <li>график;</li>
          <li>заметки;</li>
          <li>данные оплат занятий.</li>
        </ul>
        <p className="mt-3 text-xs text-[var(--tg-muted)]">
          Активная подписка в ЮKassa не отменяется автоматически — при необходимости обратитесь в поддержку.
        </p>
      </div>

      {step === 1 ? (
        <button
          type="button"
          onClick={() => setStep(2)}
          className="app-btn w-full rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-4 py-3.5 text-center text-sm font-semibold text-[var(--text-primary)]"
        >
          Я понимаю последствия
        </button>
      ) : (
        <form className="flex flex-col gap-3" onSubmit={(ev) => void onDelete(ev)}>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-[var(--text-primary)]">Введите УДАЛИТЬ для подтверждения</span>
            <input
              value={confirmPhrase}
              onChange={(ev) => setConfirmPhrase(ev.target.value)}
              className="min-h-[44px] rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3 py-2 text-[15px] text-[var(--text-primary)] outline-none focus:border-[color:color-mix(in_srgb,var(--brand-solid),transparent_35%)]"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          {error ? <p className="text-sm font-medium text-[var(--danger)]">{error}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="app-btn w-full rounded-2xl bg-[var(--danger)] px-4 py-3.5 text-center text-[15px] font-semibold text-white shadow-app-primary disabled:opacity-60"
          >
            {pending ? "Удаление…" : "Удалить аккаунт навсегда"}
          </button>
        </form>
      )}

      <Link
        href="/privacy"
        prefetch={false}
        className="app-btn block w-full rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] py-3 text-center text-sm font-semibold text-[var(--text-primary)]"
      >
        Отмена
      </Link>
    </ShellMain>
  );
}
