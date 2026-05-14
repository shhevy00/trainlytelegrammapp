import type { ReactElement, ReactNode } from "react";
import { LegalWarningCard } from "@/components/prod-shell/LegalWarningCard";
import { PageHeader } from "@/components/prod-shell/PageHeader";
import { ShellMain } from "@/components/prod-shell/ShellMain";

interface LegalDraftDocumentProps {
  title: string;
  backHref?: string;
  backLabel?: string;
  children?: ReactNode;
}

export function LegalDraftDocument({
  title,
  backHref = "/profile",
  backLabel = "Назад",
  children,
}: LegalDraftDocumentProps): ReactElement {
  return (
    <ShellMain>
      <PageHeader title={title} backHref={backHref} backLabel={backLabel} />
      <LegalWarningCard />
      <div className="premium-surface min-w-0 p-4 text-sm leading-relaxed text-[var(--text-secondary)]">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--tg-muted)]">Версия</p>
        <p className="mt-1 font-medium text-[var(--text-primary)]">v0.1 draft</p>
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-[var(--tg-muted)]">
          Дата вступления
        </p>
        <p className="mt-1 text-[var(--text-primary)]">Будет указана после юридической проверки</p>
        <div className="mt-4 border-t border-[color:var(--border-soft)] pt-4">
          {children ?? (
            <p>
              Здесь будет полный текст документа. Сейчас размещена только структура страницы для навигации и
              согласований в продукте.
            </p>
          )}
        </div>
      </div>
    </ShellMain>
  );
}
