"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, type ReactElement } from "react";
import { Card } from "@/components/ui/card";
import {
  clientFilterQueryValue,
  filterClients,
  nextPendingSlotForClient,
  type ClientListFilter,
} from "@/lib/clients/clientAttention";
import { formatOverviewHumanDate } from "@/lib/overview/dailyOperations";
import { coachClientSessionsBalanceShortRu } from "@/lib/coach/paidSessions";
import { getRecommendedCoachHint } from "@/lib/mock/recommendedAction";
import { useMockApp } from "@/lib/mock/MockAppProvider";

const chipBase =
  "shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold transition whitespace-nowrap";

const chipInactive = "border-[color:var(--border-strong)] bg-[var(--tg-bg)] text-[var(--text-primary)]";
const chipActive = "border-transparent bg-[var(--tg-accent)] text-white shadow-app-primary";

const btnPrimary =
  "app-btn flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-[var(--tg-accent)] px-3 py-2.5 text-center text-sm font-semibold text-white shadow-app-primary";

const btnGhost =
  "app-btn flex min-h-[44px] shrink-0 items-center justify-center rounded-xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-3 py-2 text-center text-sm font-semibold text-[var(--text-primary)]";

const FILTER_CHIPS: { id: ClientListFilter; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "today", label: "Сегодня" },
  { id: "attention", label: "Внимание" },
  { id: "debt", label: "Долг" },
  { id: "no_schedule", label: "Без записи" },
];

function emptyCopy(filter: ClientListFilter): { title: string; hint: string } {
  switch (filter) {
    case "today":
      return {
        title: "Здесь пока никого нет",
        hint: "Сегодня нет клиентов с тренировкой или записью в графике.",
      };
    case "attention":
      return {
        title: "Здесь пока никого нет",
        hint: "Клиенты появятся здесь, когда понадобится внимание.",
      };
    case "debt":
      return {
        title: "Здесь пока никого нет",
        hint: "Нет клиентов с долгом по занятиям (отрицательный остаток).",
      };
    case "no_schedule":
      return {
        title: "Здесь пока никого нет",
        hint: "У всех в списке есть следующая запись в графике.",
      };
    default:
      return { title: "Список пуст", hint: "" };
  }
}

export interface ClientsPageContentProps {
  initialFilter?: ClientListFilter;
}

export function ClientsPageContent({ initialFilter = "all" }: ClientsPageContentProps): ReactElement {
  const router = useRouter();
  const { todayIso, clients, scheduleItems, coachQuickNotes } = useMockApp();
  const filter = initialFilter;

  const applyFilter = (next: ClientListFilter): void => {
    const q = clientFilterQueryValue(next);
    router.replace(q == null ? "/clients" : `/clients?filter=${encodeURIComponent(q)}`, { scroll: false });
  };

  const filtered = useMemo(
    () =>
      filterClients(clients, filter, {
        todayIso,
        scheduleItems,
        quickNotes: coachQuickNotes,
      }),
    [clients, filter, scheduleItems, coachQuickNotes, todayIso],
  );

  return (
    <main className="flex w-full flex-col gap-4 px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight">Клиенты</h1>
        <p className="mt-1 text-sm text-[var(--tg-muted)]">Сегодня, внимание и оплаты — в одном списке.</p>
      </header>

      {clients.length === 0 ? (
        <Card className="flex flex-col gap-4">
          <div>
            <p className="font-medium text-[var(--text-primary)]">Клиентов пока нет.</p>
            <p className="mt-1 text-sm text-[var(--tg-muted)]">Добавьте первого клиента, чтобы начать.</p>
          </div>
          <Link
            href="/clients/new"
            prefetch={false}
            className="app-btn min-h-[44px] rounded-2xl bg-[var(--tg-accent)] px-4 py-3 text-center text-[15px] font-semibold text-white shadow-app-primary"
          >
            Добавить клиента
          </Link>
        </Card>
      ) : (
        <>
          <div className="app-scroll -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {FILTER_CHIPS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => applyFilter(c.id)}
                className={`${chipBase} ${filter === c.id ? chipActive : chipInactive}`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <Card className="border-[color:var(--border-soft)] p-4">
              {(() => {
                const { title, hint } = emptyCopy(filter);
                return (
                  <>
                    <p className="font-medium text-[var(--text-primary)]">{title}</p>
                    {hint ? <p className="mt-2 text-sm leading-relaxed text-[var(--tg-muted)]">{hint}</p> : null}
                  </>
                );
              })()}
            </Card>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {filtered.map((c) => {
                const profileHref = `/clients/${encodeURIComponent(c.id)}`;
                const startHref = `/start-workout?clientId=${encodeURIComponent(c.id)}&mode=client`;
                const payHref = `/add-payment?clientId=${encodeURIComponent(c.id)}`;
                const nextSlot = nextPendingSlotForClient(scheduleItems, c.id, todayIso);
                const hint = getRecommendedCoachHint(c);
                const hasComplaintNote = coachQuickNotes.some(
                  (n) => n.clientId === c.id && n.type === "complaint" && n.text.trim().length > 0,
                );
                const hasPaymentNote = coachQuickNotes.some(
                  (n) => n.clientId === c.id && n.type === "payment" && n.text.trim().length > 0,
                );

                const chipClass = "rounded-md bg-[var(--tg-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]";

                return (
                  <li key={c.id}>
                    <Card className="flex flex-col gap-3 border-[color:var(--border-soft)] p-3.5">
                      <div className="min-w-0">
                        <p className="font-display text-base font-semibold text-[var(--text-primary)]">{c.name}</p>
                        {c.goal ? <p className="mt-1 line-clamp-2 text-sm text-[var(--tg-muted)]">{c.goal}</p> : null}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span
                            className={`${chipClass} ${
                              c.remainingSessions < 0
                                ? "border-[color:color-mix(in_srgb,var(--danger),transparent_55%)] text-[var(--danger)]"
                                : c.remainingSessions === 0
                                  ? "border-[color:color-mix(in_srgb,var(--warning),transparent_55%)] text-[var(--warning)]"
                                  : ""
                            }`}
                          >
                            {coachClientSessionsBalanceShortRu(c.remainingSessions)}
                          </span>
                          {c.hasWorkoutToday ? <span className={chipClass}>Сегодня</span> : null}
                          {!c.hasNextWorkoutScheduled ? <span className={chipClass}>Без записи</span> : null}
                          {c.limitation?.trim() ? <span className={chipClass}>Ограничение</span> : null}
                          {c.inactiveDays >= 10 ? (
                            <span className={chipClass}>Давно не был · {c.inactiveDays} дн.</span>
                          ) : null}
                          {hasComplaintNote ? <span className={chipClass}>Жалоба</span> : null}
                          {hasPaymentNote ? <span className={chipClass}>Оплата в заметках</span> : null}
                        </div>
                        {c.lastWorkoutSummary ? (
                          <p className="mt-2 text-xs text-[var(--tg-muted)]">Последняя: {c.lastWorkoutSummary}</p>
                        ) : null}
                        {nextSlot ? (
                          <p className="mt-1 text-xs text-[var(--tg-muted)]">
                            Следующая: {formatOverviewHumanDate(nextSlot.date, todayIso)} · {nextSlot.time} ·{" "}
                            {nextSlot.title}
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-[var(--tg-muted)]">Следующая: нет в графике</p>
                        )}
                        {hint ? <p className="mt-2 text-xs leading-snug text-[var(--text-secondary)]">{hint}</p> : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link href={startHref} prefetch={false} className={btnPrimary}>
                          Начать
                        </Link>
                        <Link href={profileHref} prefetch={false} className={btnGhost}>
                          Профиль
                        </Link>
                        {c.remainingSessions <= 0 ? (
                          <Link href={payHref} prefetch={false} className={btnGhost}>
                            Оплата
                          </Link>
                        ) : null}
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
