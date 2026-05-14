"use client";

import { type ReactElement } from "react";
import { Card } from "@/components/ui/card";

const cardCls =
  "border-0 bg-[color:color-mix(in_srgb,var(--tg-card),transparent_8%)] p-4 shadow-none";

/**
 * Только текст и карточки. CTA — в `app/welcome/page.tsx` (Server Component, чистые `<a href>`),
 * чтобы переходы работали даже при сбое гидрации / клиентского роутера в WebView.
 */
export function WelcomePageContent(): ReactElement {
  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">Добро пожаловать</h1>
        <p className="text-sm text-[var(--tg-muted)]">Коротко о приложении</p>
      </header>

      <div className="flex flex-col gap-3">
        <Card className={cardCls}>
          <p className="font-display text-base font-semibold text-[var(--text-primary)]">Тренерский дневник</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--tg-text)]">
            Клиенты, тренировки, оплаты и заметки — в одном месте.
          </p>
        </Card>

        <Card className={cardCls}>
          <p className="font-display text-base font-semibold text-[var(--text-primary)]">Как работает</p>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-[var(--tg-text)]">
            <li>Добавьте клиента</li>
            <li>Запустите тренировку</li>
            <li>Сохраните в журнал</li>
          </ol>
        </Card>
      </div>
    </>
  );
}
