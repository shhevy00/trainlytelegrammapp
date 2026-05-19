import Link from "next/link";
import type { ReactElement } from "react";
import { PageHeader } from "@/components/prod-shell/PageHeader";
import { ShellMain } from "@/components/prod-shell/ShellMain";

const linkCls =
  "font-medium text-[var(--brand-solid)] underline decoration-[color:color-mix(in_srgb,var(--brand-solid),transparent_40%)] underline-offset-2";

export default function PrivacyPage(): ReactElement {
  return (
    <ShellMain>
      <PageHeader title="Данные и приватность" backHref="/profile" />

      <section className="premium-surface min-w-0 p-4">
        <h2 className="app-section-label">Что хранит Trainly</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-[var(--text-secondary)] marker:text-[var(--tg-muted)]">
          <li>профиль тренера;</li>
          <li>клиентов, которых вы добавляете;</li>
          <li>тренировки, шаблоны и график;</li>
          <li>оплаты занятий клиента;</li>
          <li>заметки.</li>
        </ul>
      </section>

      <section className="premium-surface min-w-0 p-4">
        <h2 className="app-section-label">Что не стоит хранить</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-[var(--text-secondary)] marker:text-[var(--tg-muted)]">
          <li>диагнозы;</li>
          <li>медицинские документы;</li>
          <li>паспортные данные;</li>
          <li>фотографии клиентов;</li>
          <li>лишние личные сведения.</li>
        </ul>
      </section>

      <button
        type="button"
        disabled
        className="app-btn w-full cursor-not-allowed rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] py-3 text-center text-sm font-semibold text-[var(--text-disabled)]"
        title="Скоро"
      >
        Экспортировать данные (скоро)
      </button>

      <Link
        href="/account/delete"
        prefetch={false}
        className="app-btn block w-full rounded-2xl border border-[color:color-mix(in_srgb,var(--danger),transparent_50%)] bg-[color:color-mix(in_srgb,var(--danger),transparent_92%)] py-3 text-center text-sm font-semibold text-[var(--danger)]"
      >
        Удалить аккаунт
      </Link>

      <p className="text-center text-sm text-[var(--text-secondary)]">
        <Link href="/legal/privacy" prefetch={false} className={linkCls}>
          Политика ПДн
        </Link>
        <span className="mx-2 text-[var(--tg-muted)]">·</span>
        <Link href="/legal/client-data" prefetch={false} className={linkCls}>
          Правила данных клиентов
        </Link>
      </p>
    </ShellMain>
  );
}
