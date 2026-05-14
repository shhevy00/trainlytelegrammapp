"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactElement } from "react";
import { PageHeader } from "@/components/prod-shell/PageHeader";
import { ShellMain } from "@/components/prod-shell/ShellMain";

export function AccountDeleteContent(): ReactElement {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

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
        <div className="flex flex-col gap-3">
          <p className="rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-card)] p-3 text-xs leading-relaxed text-[var(--tg-muted)]">
            <span className="font-semibold text-[var(--text-secondary)]">MVP-заглушка:</span> данные в PostgreSQL не
            удаляются. Кнопка ниже только возвращает в профиль. Фактическое удаление аккаунта и данных тренера появится
            отдельным серверным процессом (см. раздел «Удаление аккаунта» в README).
          </p>
          <button
            type="button"
            onClick={() => {
              router.push("/profile");
            }}
            className="app-btn w-full rounded-2xl bg-[var(--danger)] px-4 py-3.5 text-center text-[15px] font-semibold text-white shadow-app-primary"
          >
            Удалить аккаунт
          </button>
        </div>
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
