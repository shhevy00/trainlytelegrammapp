"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, type FormEvent, type ReactElement } from "react";
import { Card } from "@/components/ui/card";
import { buildRememberBlock } from "@/lib/mock/rememberBlock";
import { createEmptyWorkoutSessionForClient } from "@/lib/mock/startWorkoutSession";
import { useMockApp } from "@/lib/mock/MockAppProvider";
import type { MockScheduleItem, MockScheduleStatus } from "@/lib/mock/data";
import { addDaysLocal } from "@/lib/overview/dailyOperations";
import {
  formatScheduleDayTitle,
  formatWeekStripCellLabel,
  startOfIsoWeekMonday,
  weekDayIsoList,
} from "@/lib/schedule/weekDates";

const statusLabel: Record<MockScheduleStatus, string> = {
  planned: "Запланировано",
  upcoming: "Запланировано",
  completed: "Проведено",
  missed: "Пропущено",
  cancelled: "Отменено",
};

const btnPrimary =
  "app-btn w-full min-h-[48px] rounded-2xl bg-[var(--tg-accent)] px-4 py-3 text-center text-sm font-semibold text-white shadow-app-primary";

const btnSecondary =
  "app-btn inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)]";

const linkSubtle = "text-xs font-medium text-[var(--tg-muted)] underline-offset-2 hover:text-[var(--text-secondary)]";

export function SchedulePageContent(): ReactElement {
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

  const [addClientId, setAddClientId] = useState("");
  const [addTemplateId, setAddTemplateId] = useState("");
  const [addTime, setAddTime] = useState("19:00");
  const [addTitle, setAddTitle] = useState("Тренировка");
  const [addDuration, setAddDuration] = useState("60");
  const [addError, setAddError] = useState<string | null>(null);
  const [addDoneHint, setAddDoneHint] = useState(false);

  const detailsRef = useRef<HTMLDetailsElement>(null);

  const addClientTemplates = useMemo(
    () => (addClientId ? getTemplatesForClient(addClientId) : []),
    [addClientId, getTemplatesForClient],
  );

  const weekDays = useMemo(() => [...weekDayIsoList(weekStartIso)], [weekStartIso]);

  const dayCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const iso of weekDays) {
      m.set(iso, getScheduleItemsByDate(iso).length);
    }
    return m;
  }, [weekDays, getScheduleItemsByDate]);

  const items = useMemo(() => getScheduleItemsByDate(selectedDateIso), [getScheduleItemsByDate, selectedDateIso]);

  const selectedTitle = formatScheduleDayTitle(selectedDateIso, todayIso);

  const dayStats = useMemo(() => {
    let planned = 0;
    let completed = 0;
    let missed = 0;
    let cancelled = 0;
    for (const it of items) {
      if (it.status === "planned" || it.status === "upcoming") planned += 1;
      else if (it.status === "completed") completed += 1;
      else if (it.status === "missed") missed += 1;
      else if (it.status === "cancelled") cancelled += 1;
    }
    return { planned, completed, missed, cancelled };
  }, [items]);

  const openAddForm = (): void => {
    detailsRef.current?.setAttribute("open", "");
    detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const shiftWeek = (delta: number): void => {
    setWeekStartIso((w) => addDaysLocal(w, delta));
    setSelectedDateIso((s) => addDaysLocal(s, delta));
  };

  const onAddSlot = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setAddError(null);
    if (!addClientId) {
      setAddError("Выберите клиента.");
      return;
    }
    const t = addTime.trim();
    if (!/^\d{1,2}:\d{2}$/.test(t)) {
      setAddError("Время в формате ЧЧ:ММ, например 18:30.");
      return;
    }
    const client = clients.find((c) => c.id === addClientId);
    if (!client) {
      setAddError("Клиент не найден.");
      return;
    }
    const dur = Number.parseInt(addDuration.trim(), 10);
    const result = await Promise.resolve(
      addScheduleSlot({
        clientId: addClientId,
        clientName: client.name,
        dateIso: selectedDateIso,
        time: t,
        title: addTitle.trim() || "Тренировка",
        durationMinutes: Number.isFinite(dur) ? dur : 60,
        ...(addTemplateId.trim() ? { templateId: addTemplateId.trim() } : {}),
      }),
    );
    if (!result.ok) {
      setAddError(result.error);
      return;
    }
    setAddDoneHint(true);
    window.setTimeout(() => setAddDoneHint(false), 2500);
  };

  return (
    <main className="flex min-w-0 w-full flex-col gap-4 px-4 py-6 pb-[calc(6rem+max(0.35rem,env(safe-area-inset-bottom,0px)))]">
      <header className="min-w-0">
        <h1 className="font-display text-2xl font-bold tracking-tight">График</h1>
        <p className="mt-1 text-sm leading-relaxed text-[var(--tg-muted)]">
          Планируйте тренировки по дням. Пропуск и отмена не списывают занятия.
        </p>
      </header>

      <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <button type="button" className={`${btnSecondary} justify-self-start`} aria-label="Предыдущая неделя" onClick={() => shiftWeek(-7)}>
          ←
        </button>
        <p className="pointer-events-none text-center text-xs font-semibold uppercase tracking-wide text-[var(--tg-muted)]">
          Неделя
        </p>
        <button type="button" className={`${btnSecondary} justify-self-end`} aria-label="Следующая неделя" onClick={() => shiftWeek(7)}>
          →
        </button>
      </div>

      {/* Центрирование полосы недели: inline-flex min-w-full justify-center; без -mx, чтобы не съезжать относительно заголовка */}
      <div className="app-scroll w-full min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="inline-flex min-w-full justify-center">
          <div className="flex gap-2 px-0.5 touch-pan-x">
            {weekDays.map((iso) => {
              const selected = iso === selectedDateIso;
              const count = dayCounts.get(iso) ?? 0;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setSelectedDateIso(iso)}
                  className={`flex min-w-[3.35rem] shrink-0 flex-col items-center rounded-2xl border px-2.5 py-2 text-center shadow-sm transition ${
                    selected
                      ? "border-transparent bg-[var(--tg-accent)] text-white shadow-app-primary ring-2 ring-[color:color-mix(in_srgb,var(--brand-solid),transparent_45%)]"
                      : "border-[color:var(--border-soft)] bg-[var(--tg-card)] text-[var(--text-primary)] hover:border-[color:color-mix(in_srgb,var(--brand-solid),transparent_55%)]"
                  }`}
                >
                  <span className="text-[11px] font-semibold leading-tight">{formatWeekStripCellLabel(iso)}</span>
                  {count > 0 ? (
                    <span
                      className={`mt-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                        selected ? "bg-white/20 text-white" : "bg-[var(--tg-bg)] text-[var(--tg-muted)]"
                      }`}
                    >
                      {count}
                    </span>
                  ) : (
                    <span className="mt-0.5 h-[18px] w-4 shrink-0" aria-hidden />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <section className="min-w-0 rounded-2xl border border-[color:var(--border-soft)] bg-[color:color-mix(in_srgb,var(--tg-card),transparent_12%)] px-3 py-3">
        <h2 className="font-display text-lg font-bold leading-tight text-[var(--text-primary)]">{selectedTitle}</h2>
        {items.length > 0 ? (
          <p className="mt-2 text-xs leading-relaxed text-[var(--tg-muted)]">
            {[
              dayStats.planned > 0 ? `Запланировано: ${dayStats.planned}` : null,
              dayStats.completed > 0 ? `Проведено: ${dayStats.completed}` : null,
              dayStats.missed > 0 ? `Пропущено: ${dayStats.missed}` : null,
              dayStats.cancelled > 0 ? `Отменено: ${dayStats.cancelled}` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : null}
      </section>

      <details ref={detailsRef} className="rounded-2xl border border-[color:var(--border-soft)] bg-[var(--tg-card)]/80 px-3 py-2">
        <summary className="cursor-pointer list-none py-2 text-sm font-semibold text-[var(--text-primary)] [&::-webkit-details-marker]:hidden">
          Добавить тренировку
        </summary>
        <form className="flex flex-col gap-3 border-t border-[color:var(--border-soft)] pt-3 pb-2" onSubmit={(e) => void onAddSlot(e)}>
          <label className="block">
            <span className="text-xs font-medium text-[var(--tg-muted)]">Дата</span>
            <input
              type="date"
              className="mt-1 w-full rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)]"
              value={selectedDateIso}
              onChange={(ev) => {
                const v = ev.target.value;
                if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return;
                setSelectedDateIso(v);
                setWeekStartIso(startOfIsoWeekMonday(v));
              }}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-[var(--tg-muted)]">Клиент</span>
            <select
              className="mt-1 w-full rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)]"
              value={addClientId}
              onChange={(ev) => {
                const v = ev.target.value;
                setAddClientId(v);
                setAddTemplateId((prev) => {
                  if (!v || !prev) return "";
                  return getTemplatesForClient(v).some((t) => t.id === prev) ? prev : "";
                });
              }}
            >
              <option value="">Выберите</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          {addClientId ? (
            <div className="block">
              <span className="text-xs font-medium text-[var(--tg-muted)]">Шаблон тренировки</span>
              {addClientTemplates.length > 0 ? (
                <select
                  className="mt-1 w-full rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)]"
                  value={addTemplateId}
                  onChange={(ev) => {
                    const v = ev.target.value;
                    setAddTemplateId(v);
                    if (!v) return;
                    const t = addClientTemplates.find((x) => x.id === v);
                    if (!t) return;
                    setAddTitle((prev) => (prev.trim() === "" ? t.name : prev));
                  }}
                >
                  <option value="">Без шаблона</option>
                  {addClientTemplates.map((tm) => (
                    <option key={tm.id} value={tm.id}>
                      {tm.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="mt-2 rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3 py-2.5 text-sm text-[var(--tg-muted)]">
                  <p>У клиента пока нет шаблонов.</p>
                  <Link
                    href={`/clients/${encodeURIComponent(addClientId)}/templates/new`}
                    prefetch={false}
                    className="mt-2 inline-block text-xs font-semibold text-[var(--tg-accent)]"
                  >
                    Создать шаблон тренировки
                  </Link>
                </div>
              )}
            </div>
          ) : null}
          <label className="block">
            <span className="text-xs font-medium text-[var(--tg-muted)]">Время</span>
            <input
              className="mt-1 w-full rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)]"
              value={addTime}
              onChange={(ev) => setAddTime(ev.target.value)}
              inputMode="numeric"
              placeholder="18:30"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-[var(--tg-muted)]">Название</span>
            <input
              className="mt-1 w-full rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)]"
              value={addTitle}
              onChange={(ev) => setAddTitle(ev.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-[var(--tg-muted)]">Длительность (мин)</span>
            <input
              className="mt-1 w-full rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3 py-2.5 text-sm text-[var(--text-primary)]"
              value={addDuration}
              onChange={(ev) => setAddDuration(ev.target.value)}
              inputMode="numeric"
            />
          </label>
          {addError ? <p className="text-sm text-[var(--warning)]">{addError}</p> : null}
          {addDoneHint ? <p className="text-sm text-[var(--success)]">Запись добавлена.</p> : null}
          <button type="submit" className={btnPrimary}>
            Сохранить в график
          </button>
        </form>
      </details>

      {items.length === 0 ? (
        <Card className="flex flex-col items-stretch gap-4 border-[color:var(--border-soft)] text-center sm:text-left">
          <div className="space-y-1">
            <p className="text-sm font-medium text-[var(--text-primary)]">На этот день записей нет</p>
            <p className="text-sm leading-relaxed text-[var(--tg-muted)]">
              Добавьте тренировку или начните без записи.
            </p>
          </div>
          <button type="button" className={btnPrimary} onClick={openAddForm}>
            Добавить тренировку
          </button>
          <Link href="/start-workout" prefetch={false} className={`${btnSecondary} w-full min-h-[48px] justify-center py-3 text-sm`}>
            Начать без записи
          </Link>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.id}>
              <ScheduleCard
                item={item}
                onMissed={() => void Promise.resolve(markScheduleMissed(item.id))}
                onCancelled={() => void Promise.resolve(markScheduleCancelled(item.id))}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

interface ScheduleCardProps {
  item: MockScheduleItem;
  onMissed: () => void;
  onCancelled: () => void;
}

function ScheduleCard({ item, onMissed, onCancelled }: ScheduleCardProps): ReactElement {
  const router = useRouter();
  const {
    createWorkoutBootstrapFromTemplate,
    queueWorkoutBootstrap,
    getTemplateById,
    clients,
    getCoachQuickNotesForClient,
  } = useMockApp();
  const [slotStartError, setSlotStartError] = useState<string | null>(null);
  const canPlanActions = item.status === "upcoming" || item.status === "planned";
  const startHref = `/start-workout?clientId=${encodeURIComponent(item.clientId)}&scheduleItemId=${encodeURIComponent(item.id)}`;
  const clientHref = `/clients/${encodeURIComponent(item.clientId)}`;

  const liveTemplate = item.templateId ? getTemplateById(item.templateId) : undefined;
  const templateUnavailable = Boolean(item.templateId && (!liveTemplate || liveTemplate.archivedAtIso));
  const showTemplateSubline =
    Boolean(item.templateName) &&
    item.title.trim().toLowerCase() !== (item.templateName ?? "").trim().toLowerCase() &&
    !templateUnavailable;

  const onStartClick = (): void => {
    setSlotStartError(null);
    if (!item.templateId) {
      router.push(startHref);
      return;
    }
    const tpl = getTemplateById(item.templateId);
    if (!tpl || tpl.archivedAtIso || tpl.clientId !== item.clientId) {
      setSlotStartError("Шаблон недоступен. Можно начать с нуля по записи.");
      return;
    }
    const res = createWorkoutBootstrapFromTemplate({
      clientId: item.clientId,
      templateId: item.templateId,
      scheduleItemId: item.id,
      titleOverride: item.title.trim() || item.templateName || tpl.name,
    });
    if (!res.ok) {
      setSlotStartError(res.error);
      return;
    }
    router.push("/workout");
  };

  const onStartEmptyFromSlot = (): void => {
    setSlotStartError(null);
    const client = clients.find((c) => c.id === item.clientId);
    if (!client) return;
    const notes = getCoachQuickNotesForClient(item.clientId).sort((a, b) => b.createdAtMs - a.createdAtMs);
    queueWorkoutBootstrap({
      session: createEmptyWorkoutSessionForClient(client, `${item.title} · ${item.time}`, item.id),
      referenceHintsByExerciseName: {},
      rememberBlock: buildRememberBlock(client, {}, notes),
      startSource: "schedule",
    });
    router.push("/workout");
  };

  return (
    <Card className="flex flex-col gap-3 border-[color:var(--border-soft)]">
      <div className="flex min-w-0 flex-row items-start gap-3">
        <div className="shrink-0 pt-0.5 text-right">
          <p className="text-base font-bold tabular-nums leading-none text-[var(--text-primary)] sm:text-lg">{item.time}</p>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold leading-snug text-[var(--text-primary)]">{item.clientName}</p>
              <p className="mt-0.5 text-sm leading-snug text-[var(--tg-muted)]">
                {item.title} · {item.durationMinutes} мин
              </p>
              {templateUnavailable ? (
                <p className="mt-1 text-xs font-medium text-[var(--warning)]">Шаблон недоступен</p>
              ) : showTemplateSubline ? (
                <p className="mt-1 text-xs text-[var(--tg-muted)]">
                  Шаблон: <span className="font-medium text-[var(--tg-text)]">{item.templateName}</span>
                </p>
              ) : item.templateName ? (
                <p className="mt-1 text-xs text-[var(--tg-muted)]">
                  Шаблон: <span className="font-medium text-[var(--tg-text)]">{item.templateName}</span>
                </p>
              ) : null}
            </div>
            <span
              className={`max-w-[9.5rem] shrink-0 truncate rounded-full px-2.5 py-1 text-center text-[11px] font-semibold leading-tight sm:max-w-none sm:whitespace-normal sm:px-3 sm:text-xs ${
                item.status === "completed"
                  ? "bg-[color:color-mix(in_srgb,var(--success),transparent_88%)] text-[var(--success)]"
                  : item.status === "missed" || item.status === "cancelled"
                    ? "bg-[color:color-mix(in_srgb,var(--danger),transparent_88%)] text-[var(--danger)]"
                    : item.status === "upcoming"
                      ? "bg-[color:color-mix(in_srgb,var(--info),transparent_88%)] text-[var(--info)]"
                      : "bg-[var(--tg-bg)] text-[var(--tg-muted)]"
              }`}
            >
              {statusLabel[item.status]}
            </span>
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        {canPlanActions ? (
          <div className="flex min-w-0 flex-col gap-2">
            {slotStartError ? (
              <p className="text-xs font-medium text-[var(--warning)]">{slotStartError}</p>
            ) : null}
            <button type="button" className={btnPrimary} onClick={onStartClick}>
              Начать
            </button>
            {item.templateId && slotStartError ? (
              <button type="button" className={`${btnSecondary} w-full justify-center`} onClick={onStartEmptyFromSlot}>
                Начать без шаблона
              </button>
            ) : null}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[color:var(--border-soft)] pt-2">
              <Link href={clientHref} prefetch={false} className={`${linkSubtle} underline`}>
                Открыть клиента
              </Link>
              <button type="button" className={`${linkSubtle} text-[var(--warning)]`} onClick={onMissed}>
                Отметить пропуск
              </button>
              <button type="button" className={`${linkSubtle} text-red-400`} onClick={onCancelled}>
                Отменить
              </button>
            </div>
          </div>
        ) : null}

        {item.status === "completed" ? (
          <div className="flex flex-col gap-2 border-t border-[color:var(--border-soft)] pt-2">
            {item.workoutId ? (
              <Link href={`/workouts/${item.workoutId}`} className={btnPrimary} prefetch={false}>
                Открыть тренировку
              </Link>
            ) : (
              <span className="text-xs text-[var(--tg-muted)]">Запись в журнале не привязана.</span>
            )}
            <Link href={clientHref} prefetch={false} className={`${linkSubtle} self-start underline`}>
              Открыть клиента
            </Link>
          </div>
        ) : null}

        {(item.status === "missed" || item.status === "cancelled") && (
          <div className="border-t border-[color:var(--border-soft)] pt-2">
            <Link href={clientHref} prefetch={false} className={`${linkSubtle} underline`}>
              Открыть клиента
            </Link>
          </div>
        )}
      </div>
    </Card>
  );
}
