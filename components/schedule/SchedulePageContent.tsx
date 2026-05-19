"use client";

import Link from "next/link";
import { useMemo, useState, type ReactElement } from "react";
import { ScheduleAddForm } from "@/components/schedule/ScheduleAddForm";
import { ScheduleSlotCard } from "@/components/schedule/ScheduleSlotCard";
import { ProductAccessPaywall } from "@/components/shell/ProductAccessPaywall";
import type { TrainlyDataSource } from "@/lib/config/dataSource";
import { useMockApp } from "@/lib/mock/MockAppProvider";
import { addDaysLocal } from "@/lib/overview/dailyOperations";
import { resolveScheduleDayListState, schedulePendingRecordsLabel } from "@/lib/schedule/scheduleCalendar";
import {
  formatDayOfMonth,
  formatScheduleDayTitle,
  formatWeekRangeLabel,
  formatWeekdayShort,
  startOfIsoWeekMonday,
  weekDayIsoList,
} from "@/lib/schedule/weekDates";

export function SchedulePageContent({ trainlyDataMode }: { trainlyDataMode: TrainlyDataSource }): ReactElement {
  const {
    todayIso,
    getScheduleItemsByDate,
    markScheduleMissed,
    markScheduleCancelled,
    addScheduleSlot,
    clients,
    getTemplatesForClient,
  } = useMockApp();

  const [weekStartIso, setWeekStartIso] = useState(() => startOfIsoWeekMonday(todayIso));
  const [selectedDateIso, setSelectedDateIso] = useState(todayIso);
  const [showAddForm, setShowAddForm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const weekDays = useMemo(() => [...weekDayIsoList(weekStartIso)], [weekStartIso]);

  const dayCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const iso of weekDays) {
      const all = getScheduleItemsByDate(iso);
      m.set(iso, all.filter((s) => s.status !== "completed").length);
    }
    return m;
  }, [weekDays, getScheduleItemsByDate]);

  const allOnSelectedDay = useMemo(
    () => getScheduleItemsByDate(selectedDateIso),
    [getScheduleItemsByDate, selectedDateIso],
  );

  const dayState = useMemo(() => resolveScheduleDayListState(allOnSelectedDay), [allOnSelectedDay]);

  const selectedTitle = formatScheduleDayTitle(selectedDateIso, todayIso);
  const weekRange = formatWeekRangeLabel(weekStartIso);
  const isViewingToday = selectedDateIso === todayIso;
  const pendingCount = dayState.kind === "list" ? dayState.items.length : 0;

  const goToToday = (): void => {
    setSelectedDateIso(todayIso);
    setWeekStartIso(startOfIsoWeekMonday(todayIso));
  };

  const shiftWeek = (delta: number): void => {
    const nextWeek = addDaysLocal(weekStartIso, delta);
    setWeekStartIso(nextWeek);
    setSelectedDateIso((s) => addDaysLocal(s, delta));
  };

  const handleAddSubmit = async (payload: {
    clientId: string;
    time: string;
    title: string;
    durationMinutes: number;
    templateId?: string;
  }): Promise<{ ok: true } | { ok: false; error: string }> => {
    const client = clients.find((c) => c.id === payload.clientId);
    if (!client) return { ok: false, error: "Клиент не найден." };
    const result = await Promise.resolve(
      addScheduleSlot({
        clientId: payload.clientId,
        clientName: client.name,
        dateIso: selectedDateIso,
        time: payload.time,
        title: payload.title,
        durationMinutes: payload.durationMinutes,
        ...(payload.templateId ? { templateId: payload.templateId } : {}),
      }),
    );
    if (result.ok) {
      setToast("Запись добавлена");
      window.setTimeout(() => setToast(null), 2200);
    }
    return result;
  };

  return (
    <main className="schedule-page flex min-w-0 w-full flex-col px-4 py-5 pb-[calc(6rem+max(0.35rem,env(safe-area-inset-bottom,0px)))]">
      {toast ? (
        <div className="schedule-toast" role="status">
          {toast}
        </div>
      ) : null}

      <header className="schedule-header">
        <h1 className="schedule-header__title">График</h1>
        <p className="schedule-header__hint">
          Запланируйте день. После тренировки запись уходит из графика — она остаётся в журнале и в KPI обзора.
        </p>
      </header>

      <ProductAccessPaywall trainlyDataMode={trainlyDataMode} />

      <section className="schedule-week-panel" aria-label="Неделя">
        <div className="schedule-week-bar">
          <button type="button" className="schedule-week-bar__nav" onClick={() => shiftWeek(-7)} aria-label="Предыдущая неделя">
            ‹
          </button>
          <span className="schedule-week-bar__range">{weekRange}</span>
          <button type="button" className="schedule-week-bar__nav" onClick={() => shiftWeek(7)} aria-label="Следующая неделя">
            ›
          </button>
          {!isViewingToday ? (
            <button type="button" className="schedule-week-bar__today" onClick={goToToday}>
              Сегодня
            </button>
          ) : null}
        </div>

        <div className="schedule-days" role="tablist" aria-label="Дни недели">
          {weekDays.map((iso) => {
            const selected = iso === selectedDateIso;
            const isToday = iso === todayIso;
            const count = dayCounts.get(iso) ?? 0;
            return (
              <button
                key={iso}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setSelectedDateIso(iso)}
                className={[
                  "schedule-day-pill",
                  selected ? "schedule-day-pill--selected" : "",
                  isToday ? "schedule-day-pill--today" : "",
                  count > 0 ? "schedule-day-pill--has-items" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className="schedule-day-pill__wd">{formatWeekdayShort(iso)}</span>
                <span className="schedule-day-pill__num">{formatDayOfMonth(iso)}</span>
                {count > 0 ? <span className="schedule-day-pill__count">{count}</span> : null}
              </button>
            );
          })}
        </div>
      </section>

      <div className="schedule-day-head">
        <div>
          <h2 className="schedule-day-head__title">{selectedTitle}</h2>
          <p className="schedule-day-head__sub">{schedulePendingRecordsLabel(pendingCount)}</p>
        </div>
        <button
          type="button"
          className="schedule-day-head__add"
          onClick={() => setShowAddForm((v) => !v)}
          aria-expanded={showAddForm}
        >
          {showAddForm ? "Закрыть" : "+ Запись"}
        </button>
      </div>

      {showAddForm ? (
        <ScheduleAddForm
          selectedDateIso={selectedDateIso}
          clients={clients}
          getTemplatesForClient={getTemplatesForClient}
          onDateChange={(iso, weekStart) => {
            setSelectedDateIso(iso);
            setWeekStartIso(weekStart);
          }}
          onSubmit={handleAddSubmit}
          onClose={() => setShowAddForm(false)}
        />
      ) : null}

      {dayState.kind === "list" ? (
        <ul className="schedule-list">
          {dayState.items.map((item) => (
            <li key={item.id}>
              <ScheduleSlotCard
                item={item}
                onMissed={() => {
                  void Promise.resolve(markScheduleMissed(item.id)).then(() => {
                    setToast("Слот отмечен как пропуск");
                  });
                }}
                onCancelled={() => {
                  void Promise.resolve(markScheduleCancelled(item.id)).then(() => {
                    setToast("Запись отменена");
                  });
                }}
              />
            </li>
          ))}
        </ul>
      ) : dayState.kind === "all_done" ? (
        <div className="schedule-empty schedule-empty--done">
          <p className="schedule-empty__title">На этот день всё проведено</p>
          <p className="schedule-empty__text">Записи после тренировки не показываются в графике — смотрите результат в журнале.</p>
          <Link href="/journal" prefetch={false} className="schedule-empty__btn schedule-empty__btn--primary">
            Открыть журнал
          </Link>
          <button type="button" className="schedule-empty__link" onClick={() => setShowAddForm(true)}>
            Добавить ещё запись
          </button>
        </div>
      ) : (
        <div className="schedule-empty">
          <p className="schedule-empty__title">На этот день записей нет</p>
          <p className="schedule-empty__text">Добавьте слот в график или начните тренировку без записи.</p>
          <button type="button" className="schedule-empty__btn schedule-empty__btn--primary" onClick={() => setShowAddForm(true)}>
            Добавить запись
          </button>
          <Link href="/start-workout" prefetch={false} className="schedule-empty__link">
            Начать без записи
          </Link>
        </div>
      )}
    </main>
  );
}
