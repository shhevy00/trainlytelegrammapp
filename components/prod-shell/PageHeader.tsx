import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  backHref?: string;
  backLabel?: string;
}

export function PageHeader({
  title,
  subtitle,
  backHref = "/profile",
  backLabel = "Назад",
}: PageHeaderProps): ReactElement {
  return (
    <header className="flex min-w-0 flex-col gap-1.5">
      {backHref ? (
        <Link
          href={backHref}
          prefetch={false}
          className="inline-flex min-h-[44px] max-w-full items-center text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <span aria-hidden className="mr-1.5 shrink-0">
            ←
          </span>
          <span className="min-w-0 truncate">{backLabel}</span>
        </Link>
      ) : null}
      <h1 className="app-page-title break-words">{title}</h1>
      {subtitle ? <p className="app-body-secondary min-w-0 break-words">{subtitle}</p> : null}
    </header>
  );
}
