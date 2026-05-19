import Link from "next/link";
import type { ReactElement } from "react";
import { IconCalendar, IconChevronRight, IconClock } from "@/components/overview/overviewIcons";
import type { MockScheduleItem } from "@/lib/mock/data";
import { slotRowSecondLine } from "@/lib/overview/overviewSlotDisplay";

interface OverviewLaterTodayListProps {
  laterSlots: readonly MockScheduleItem[];
  laterHiddenCount: number;
}

export function OverviewLaterTodayList({
  laterSlots,
  laterHiddenCount,
}: OverviewLaterTodayListProps): ReactElement {
  return (
    <section className="overview-card overview-later-card shrink-0" aria-label="Следующие записи на сегодня">
      <div className="overview-section-head">
        <IconClock className="h-4 w-4 shrink-0 text-[var(--brand-violet)]" />
        <p className="overview-section-title">Дальше сегодня</p>
      </div>

      {laterSlots.length > 0 ? (
        <ul className="overview-later-list divide-y divide-[color:var(--border-soft)]">
          {laterSlots.map((slot, index) => {
            const href = `/start-workout?clientId=${encodeURIComponent(slot.clientId)}&scheduleItemId=${encodeURIComponent(slot.id)}`;
            const dotClass =
              index % 2 === 0 ? "overview-later-dot overview-later-dot--violet" : "overview-later-dot overview-later-dot--pink";
            return (
              <li key={slot.id}>
                <Link href={href} prefetch={false} className="overview-later-row transition-opacity active:opacity-80">
                  <div className="flex w-[4.5rem] shrink-0 items-center gap-2">
                    <span className={dotClass} aria-hidden />
                    <span className="font-display text-sm font-bold tabular-nums text-[var(--text-primary)]">
                      {slot.time}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-snug text-[var(--text-primary)]">{slot.clientName}</p>
                    <p className="mt-0.5 text-xs leading-snug text-[var(--text-secondary)]">{slotRowSecondLine(slot)}</p>
                  </div>
                  <IconChevronRight className="h-4 w-4 shrink-0 text-[var(--text-muted)] opacity-60" />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="overview-later-empty">На сегодня других записей нет</p>
      )}

      {laterHiddenCount > 0 ? (
        <p className="mt-2 text-center text-[11px] font-medium text-[var(--tg-muted)]">
          Ещё {laterHiddenCount} в графике
        </p>
      ) : null}

      <Link href="/schedule" prefetch={false} className="overview-open-schedule mt-3">
        <IconCalendar className="text-[var(--brand-violet)]" />
        Открыть график
      </Link>
    </section>
  );
}
