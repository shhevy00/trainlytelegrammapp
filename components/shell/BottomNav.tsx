"use client";

import { usePathname } from "next/navigation";
import type { ReactElement } from "react";
import { TrainlyNavAnchor } from "@/components/navigation/TrainlyNavAnchor";


const navItem =
  "relative flex min-h-[52px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-1 pb-2 text-[10px] font-medium leading-tight text-[var(--text-muted)] transition-colors active:scale-[0.98] sm:text-[11px]";

const navActive =
  "font-semibold text-[var(--text-primary)] after:pointer-events-none after:absolute after:bottom-1 after:left-1/2 after:h-[3px] after:w-6 after:-translate-x-1/2 after:rounded-full after:bg-[var(--brand-solid)] after:content-[''] sm:after:w-7";

function IconHome({ active }: { active: boolean }): ReactElement {
  const stroke = active ? "var(--brand-solid)" : "var(--text-muted)";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconUsers({ active }: { active: boolean }): ReactElement {
  const stroke = active ? "var(--brand-solid)" : "var(--text-muted)";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <path
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8 10v-2a4 4 0 0 0-3-3.87m-4-12.13a4 4 0 0 1 0 7.75"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconJournal({ active }: { active: boolean }): ReactElement {
  const stroke = active ? "var(--brand-solid)" : "var(--text-muted)";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <path
        d="M8 6h10M8 12h10M8 18h6M4 6h.01M4 12h.01M4 18h.01"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconCalendar({ active }: { active: boolean }): ReactElement {
  const stroke = active ? "var(--brand-solid)" : "var(--text-muted)";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <path
        d="M16 2v4M8 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconSubscription({ active }: { active: boolean }): ReactElement {
  const stroke = active ? "var(--brand-solid)" : "var(--text-muted)";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <path
        d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v8ZM4 8v8a2 2 0 0 0 2 2h12v-8H4Z"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 15h.01" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function BottomNav(): ReactElement | null {
  const pathname = usePathname();

  const isOverview = pathname === "/overview" || pathname === "/";
  const isClients = pathname.startsWith("/clients");
  const isBilling = pathname.startsWith("/billing");
  const isJournal = pathname.startsWith("/journal");
  const isSchedule = pathname.startsWith("/schedule");

  if (pathname.startsWith("/workout")) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center">
      <div className="w-full max-w-[min(100%,480px)] min-w-0">
        <nav
          className="border-t border-[color:var(--border-soft)] bg-[color:color-mix(in_srgb,var(--bg-sheet),transparent_8%)] pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-1.5 shadow-[var(--shadow-nav)] backdrop-blur-xl supports-[backdrop-filter]:bg-[color:color-mix(in_srgb,var(--bg-sheet),transparent_12%)]"
          aria-label="Основная навигация"
        >
          <div className="mx-auto grid w-full min-w-0 grid-cols-5 items-stretch gap-0 px-1 sm:px-2">
            <TrainlyNavAnchor
              href="/overview"
              className={`${navItem} ${isOverview ? navActive : "hover:text-[var(--text-primary)]"}`}
            >
              <IconHome active={isOverview} />
              <span className="max-w-full truncate text-center">Обзор</span>
            </TrainlyNavAnchor>
            <TrainlyNavAnchor
              href="/schedule"
              className={`${navItem} ${isSchedule ? navActive : "hover:text-[var(--text-primary)]"}`}
            >
              <IconCalendar active={isSchedule} />
              <span className="max-w-full truncate text-center">График</span>
            </TrainlyNavAnchor>
            <TrainlyNavAnchor
              href="/clients"
              className={`${navItem} ${isClients ? navActive : "hover:text-[var(--text-primary)]"}`}
            >
              <IconUsers active={isClients} />
              <span className="max-w-full truncate text-center">Клиенты</span>
            </TrainlyNavAnchor>
            <TrainlyNavAnchor
              href="/journal"
              className={`${navItem} ${isJournal ? navActive : "hover:text-[var(--text-primary)]"}`}
            >
              <IconJournal active={isJournal} />
              <span className="max-w-full truncate text-center">Журнал</span>
            </TrainlyNavAnchor>
            <TrainlyNavAnchor
              href="/billing/plans"
              className={`${navItem} ${isBilling ? navActive : "hover:text-[var(--text-primary)]"}`}
            >
              <IconSubscription active={isBilling} />
              <span className="max-w-full truncate text-center">Подписка</span>
            </TrainlyNavAnchor>
          </div>
        </nav>
      </div>
    </div>
  );
}
