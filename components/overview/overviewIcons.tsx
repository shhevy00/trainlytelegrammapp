import type { ReactElement, ReactNode } from "react";

export function IconCalendar({ className = "shrink-0" }: { className?: string }): ReactElement {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 2v4M16 2v4M4 9h16M5 5h14a2 2 0 012 2v13a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconBolt({ className = "shrink-0" }: { className?: string }): ReactElement {
  return (
    <svg className={className} width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M13 2L4 14h7l-1 8 10-12h-7l0-8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function IconClock({ className = "shrink-0" }: { className?: string }): ReactElement {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.65" />
      <path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconPlay({ className = "text-white" }: { className?: string }): ReactElement {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M9 7.5v9l7.5-4.5L9 7.5z" />
    </svg>
  );
}

export function IconSkipForward({ className = "shrink-0" }: { className?: string }): ReactElement {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 5.5v13l9.5-6.5L5 5.5zM16 6v12"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconTrash({ className = "shrink-0" }: { className?: string }): ReactElement {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 4v7m4-7v7M6 7l.6 11.2A1 1 0 007.6 19.4h8.8a1 1 0 001-1.2L18 7"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconClipboard({ className = "shrink-0" }: { className?: string }): ReactElement {
  return (
    <svg className={className} width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconMoreHorizontal({ className = "shrink-0" }: { className?: string }): ReactElement {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="6" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="18" cy="12" r="1.5" />
    </svg>
  );
}

export function IconJournal({ className = "text-white" }: { className?: string }): ReactElement {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 4h9a2 2 0 012 2v14l-4-2-4 2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinejoin="round"
      />
      <path d="M10 9h5M10 13h4" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" />
    </svg>
  );
}

export function IconSparkle({ className = "shrink-0 text-[var(--brand-pink)]" }: { className?: string }): ReactElement {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconChevronRight({ className = "text-[var(--text-muted)]" }: { className?: string }): ReactElement {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconLightning({ className = "shrink-0" }: { className?: string }): ReactElement {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M13 2L4 14h7l-1 8 10-12h-7l0-8z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconUserPlus({ className = "shrink-0" }: { className?: string }): ReactElement {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm6-8v6m3-3h-6"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconCard({ className = "shrink-0" }: { className?: string }): ReactElement {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.65" />
      <path d="M2 10h20" stroke="currentColor" strokeWidth="1.65" />
    </svg>
  );
}

export function IconNote({ className = "shrink-0" }: { className?: string }): ReactElement {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 4h8a2 2 0 012 2v12.5a.5.5 0 01-.78.41L14 17.5l-3.22 1.41A.5.5 0 0110 18.5V6a2 2 0 00-2-2z"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinejoin="round"
      />
      <path d="M10 9h6M10 12.5h4" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" />
    </svg>
  );
}

const OVERVIEW_STAT_ICON_SIZE = 20;
const OVERVIEW_STAT_STROKE = 1.75;

function OverviewStatGlyph({
  className = "shrink-0",
  children,
}: {
  className?: string;
  children: ReactNode;
}): ReactElement {
  return (
    <svg
      className={className}
      width={OVERVIEW_STAT_ICON_SIZE}
      height={OVERVIEW_STAT_ICON_SIZE}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <g
        stroke="currentColor"
        strokeWidth={OVERVIEW_STAT_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </g>
    </svg>
  );
}

/** CircleCheck — завершено. */
export function IconCheckStat({ className = "shrink-0" }: { className?: string }): ReactElement {
  return (
    <OverviewStatGlyph className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </OverviewStatGlyph>
  );
}

/** Calendar + clock — запланировано впереди. */
export function IconUpcomingStat({ className = "shrink-0" }: { className?: string }): ReactElement {
  return (
    <OverviewStatGlyph className={className}>
      <rect x="3" y="4.5" width="11.5" height="11.5" rx="2" />
      <path d="M3 8.5h11.5" />
      <path d="M6 2.5v3" />
      <path d="M11.5 2.5v3" />
      <circle cx="8.25" cy="12" r="1.1" />
      <circle cx="17.25" cy="16.75" r="4" />
      <path d="M17.25 14.75v2" />
      <path d="M17.25 16.75 19 18.5" />
    </OverviewStatGlyph>
  );
}

/** ReceiptText + CircleAlert — неоплаченные суммы. */
export function IconDebtStat({ className = "shrink-0" }: { className?: string }): ReactElement {
  return (
    <OverviewStatGlyph className={className}>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M14 8H8" />
      <path d="M16 12H8" />
      <path d="M13 16H8" />
      <circle cx="18.25" cy="6.25" r="2.75" />
      <path d="M18.25 5v1.65M18.25 8.15h.01" />
    </OverviewStatGlyph>
  );
}

export function IconChipBalance({ className = "shrink-0" }: { className?: string }): ReactElement {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconChipJoint({ className = "shrink-0" }: { className?: string }): ReactElement {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7.5v4M9 14h6l-1.5 6h-3L9 14z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconChipClock({ className = "shrink-0" }: { className?: string }): ReactElement {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 8v5l3 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
