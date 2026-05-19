import Link from "next/link";
import { useMemo, type ReactElement } from "react";
import { overviewGreeting } from "@/lib/overview/overviewGreeting";

interface OverviewHeaderProps {
  trainerDisplayName: string;
  trainerInitial: string;
}

export function OverviewHeader({ trainerDisplayName, trainerInitial }: OverviewHeaderProps): ReactElement {
  const greeting = useMemo(() => overviewGreeting(), []);

  return (
    <header className="overview-header flex shrink-0 min-w-0 items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="overview-header-greeting">{greeting},</p>
        <h1 className="overview-header-name">{trainerDisplayName}</h1>
      </div>
      <Link
        href="/profile"
        prefetch={false}
        className="overview-profile-link flex h-12 w-12 min-h-[48px] min-w-[48px] shrink-0 items-center justify-center rounded-full bg-[var(--bg-card-elevated)] font-display text-sm font-bold text-[var(--text-primary)]"
        aria-label="Профиль"
      >
        {trainerInitial}
      </Link>
    </header>
  );
}
