"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";
import { ContextualAiHelper } from "@/components/ai/ContextualAiHelper";
import {
  formatOverviewHumanDate,
  nextPendingScheduleSlot,
  rollupScheduleForDay,
  todayPendingSlotsSorted,
} from "@/lib/overview/dailyOperations";
import { countClientsWithSessionDebt } from "@/lib/overview/overviewDayKpis";
import {
  buildOverviewAiPreparationFacts,
  buildWhatToRememberLine,
  countLaterTodayHidden,
  formatTodayProgressSplit,
} from "@/lib/overview/preWorkoutContext";
import type { MockScheduleItem } from "@/lib/mock/data";
import { MOCK_OVERVIEW_LATER_TODAY_LIMIT, mockTrainer } from "@/lib/mock/data";
import { formatJournalDayLabel, formatJournalTime } from "@/lib/mock/journalSeed";
import { useMockApp } from "@/lib/mock/MockAppProvider";

const labelToday =
  "inline-flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[var(--brand-solid)]";

const btnHeroSecondary =
  "app-btn inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[color:var(--border-violet-soft)] bg-[color:color-mix(in_srgb,var(--bg-page),transparent_40%)] px-4 py-3 text-center text-sm font-semibold text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm";

const btnHeroSecondaryCompact =
  "app-btn inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-[color:var(--border-violet-soft)] bg-[color:color-mix(in_srgb,var(--bg-page),transparent_40%)] px-3 py-2 text-center text-sm font-semibold text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm";

const btnGradientStart =
  "app-btn relative flex h-12 min-h-[48px] min-w-0 flex-1 shrink items-center justify-center gap-2 overflow-hidden rounded-2xl bg-brand-gradient px-3 text-center text-[15px] font-bold leading-none text-white whitespace-nowrap shadow-[0_8px_28px_rgba(0,0,0,0.32)] sm:px-5";

const btnAiCompact =
  "app-btn flex h-12 w-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl border border-[color:var(--border-violet-soft)] bg-[color:color-mix(in_srgb,var(--bg-page),transparent_45%)] text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm";

function IconCalendar({ className = "shrink-0" }: { className?: string }): ReactElement {
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

function IconBolt({ className = "shrink-0" }: { className?: string }): ReactElement {
  return (
    <svg className={className} width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M13 2L4 14h7l-1 8 10-12h-7l0-8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function IconClock({ className = "shrink-0" }: { className?: string }): ReactElement {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.65" />
      <path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconPlay({ className = "text-white" }: { className?: string }): ReactElement {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M9 7.5v9l7.5-4.5L9 7.5z" />
    </svg>
  );
}

function IconSparkle({ className = "shrink-0 text-[var(--brand-pink)]" }: { className?: string }): ReactElement {
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

function IconChevronRight({ className = "text-[var(--text-muted)]" }: { className?: string }): ReactElement {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function nextSessionSubtitle(slot: MockScheduleItem): string {
  const tmpl = slot.templateName?.trim();
  const titleSame = tmpl && slot.title.trim().toLowerCase() === tmpl.toLowerCase();
  const titlePart = tmpl && !titleSame ? `${slot.title} · ${tmpl}` : slot.title;
  return `${titlePart} · ${slot.durationMinutes} мин`;
}

function slotRowSecondLine(slot: MockScheduleItem): string {
  const tmpl = slot.templateName?.trim();
  const titleSameAsTmpl = tmpl && slot.title.trim().toLowerCase() === tmpl.toLowerCase();
  const titlePart = tmpl && !titleSameAsTmpl ? `${slot.title} · ${tmpl}` : slot.title;
  const t = titlePart.trim();
  if (t.length === 0) return `${slot.durationMinutes} мин`;
  return `${t} · ${slot.durationMinutes} мин`;
}

export function OverviewPageContent(): ReactElement {
  const router = useRouter();
  const {
    todayIso,
    clients,
    scheduleItems,
    overviewDraftPreview,
    consumeOverviewDraftBootstrap,
    clearOverviewWorkoutDraft,
    mockLifecycle,
    markOnboardingSeen,
  } = useMockApp();

  const [aiSheetOpen, setAiSheetOpen] = useState(false);

  /** Один раз за вкладку после welcome: mock localStorage + live server action (идемпотентно). */
  useEffect(() => {
    const key = "trainly-onboarding-overview-mark";
    try {
      if (sessionStorage.getItem(key) === "1") return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* sessionStorage недоступен — всё равно помечаем один раз за mount */
    }
    void Promise.resolve(markOnboardingSeen());
  }, [markOnboardingSeen]);

  const scheduleRollup = useMemo(() => rollupScheduleForDay(scheduleItems, todayIso), [scheduleItems, todayIso]);

  const nextSlot = useMemo(
    () => nextPendingScheduleSlot(scheduleItems, todayIso),
    [scheduleItems, todayIso],
  );

  const laterSlots = useMemo(() => {
    const today = todayPendingSlotsSorted(scheduleItems, todayIso);
    if (!nextSlot) return [];
    const idx = today.findIndex((s) => s.id === nextSlot.id);
    if (idx === -1) return today.slice(0, MOCK_OVERVIEW_LATER_TODAY_LIMIT);
    return today.slice(idx + 1, idx + 1 + MOCK_OVERVIEW_LATER_TODAY_LIMIT);
  }, [scheduleItems, todayIso, nextSlot]);

  const laterHiddenCount = useMemo(
    () => countLaterTodayHidden(scheduleItems, todayIso, nextSlot, laterSlots.length),
    [scheduleItems, todayIso, nextSlot, laterSlots.length],
  );

  const nextClient = useMemo(
    () => (nextSlot ? clients.find((c) => c.id === nextSlot.clientId) : undefined),
    [clients, nextSlot],
  );

  const nextDateLine = useMemo(() => {
    if (!nextSlot || nextSlot.date === todayIso) return null;
    return formatOverviewHumanDate(nextSlot.date, todayIso);
  }, [nextSlot, todayIso]);

  const whatToRemember = useMemo(() => {
    if (!nextSlot || !nextClient) return null;
    return buildWhatToRememberLine(nextClient, nextSlot);
  }, [nextSlot, nextClient]);

  const aiFacts = useMemo(() => {
    if (!nextSlot) return [];
    return buildOverviewAiPreparationFacts(nextClient, nextSlot, whatToRemember);
  }, [nextClient, nextSlot, whatToRemember]);

  const handleDraftContinue = (): void => {
    const ok = consumeOverviewDraftBootstrap();
    if (ok) router.push("/workout");
  };

  const nextStartHref = nextSlot
    ? `/start-workout?clientId=${encodeURIComponent(nextSlot.clientId)}&scheduleItemId=${encodeURIComponent(nextSlot.id)}`
    : "";

  const calmDayNoSchedule = scheduleRollup.totalTrackedSlots === 0;

  const todayProgressSplit = useMemo(() => formatTodayProgressSplit(scheduleRollup), [scheduleRollup]);

  const trainerDisplayName = useMemo(
    () => mockLifecycle.trainerProfile?.displayName.trim() || mockTrainer.firstName.trim() || "Тренер",
    [mockLifecycle.trainerProfile],
  );

  const trainerInitial = trainerDisplayName.slice(0, 1).toUpperCase();

  const expiredPaywallBanner =
    mockLifecycle.mockSubscriptionStatus === "expired" ? (
      <div
        className="shrink-0 rounded-2xl border border-[color:color-mix(in_srgb,var(--warning),transparent_45%)] bg-[color:color-mix(in_srgb,var(--warning),transparent_88%)] p-3 text-sm text-[var(--text-primary)]"
        role="status"
      >
        <p className="font-medium leading-snug">Демо: доступ истёк. Так будет выглядеть paywall-сценарий.</p>
        <Link
          href="/billing/plans"
          prefetch={false}
          className="app-btn mt-2 flex min-h-[44px] w-full items-center justify-center rounded-xl bg-[var(--tg-accent)] px-3 py-2.5 text-center text-sm font-semibold text-white shadow-app-primary"
        >
          Выбрать тариф
        </Link>
      </div>
    ) : null;

  const debtClientsCount = useMemo(() => countClientsWithSessionDebt(clients), [clients]);

  const closeAiSheet = useCallback((): void => {
    setAiSheetOpen(false);
  }, []);

  useEffect(() => {
    if (!aiSheetOpen) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") closeAiSheet();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aiSheetOpen, closeAiSheet]);

  if (clients.length === 0) {
    return (
      <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-6 px-4 py-6 pb-5">
        <header className="flex shrink-0 min-w-0 items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-[var(--tg-muted)]">Добрый день,</p>
            <h1 className="font-display text-[1.75rem] font-bold leading-tight tracking-tight text-[var(--text-primary)] sm:text-3xl">
              {trainerDisplayName}
            </h1>
          </div>
          <Link
            href="/profile"
            prefetch={false}
            className="flex h-12 w-12 min-h-[48px] min-w-[48px] shrink-0 items-center justify-center rounded-full border border-[color:var(--border-violet-soft)] bg-[color:color-mix(in_srgb,var(--bg-card),transparent_20%)] font-display text-sm font-bold text-[var(--text-primary)] shadow-[0_0_24px_rgba(168,85,247,0.2)] backdrop-blur-sm"
            aria-label="Профиль"
          >
            {trainerInitial}
          </Link>
        </header>
        {expiredPaywallBanner}
        <div className="premium-surface p-6">
          <p className="text-base font-semibold text-[var(--text-primary)]">Быстрый запуск</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            Добавьте клиента, создайте шаблон и сохраните первую тренировку.
          </p>
          <Link
            href="/clients/new"
            prefetch={false}
            className="app-btn mt-5 flex min-h-[50px] items-center justify-center rounded-2xl bg-brand-gradient px-4 py-3.5 text-[15px] font-bold text-white shadow-[0_8px_28px_rgba(0,0,0,0.3)]"
          >
            Добавить клиента
          </Link>
        </div>
      </main>
    );
  }

  const draftBlock =
    overviewDraftPreview != null ? (
      <div className="premium-surface shrink-0 p-4 sm:p-5">
        <p className="text-xs font-medium text-[var(--tg-muted)]">Черновик</p>
        <p className="mt-1 font-display text-xl font-bold text-[var(--text-primary)]">{overviewDraftPreview.clientName}</p>
        <p className="mt-0.5 text-sm text-[var(--tg-muted)]">{overviewDraftPreview.title}</p>
        <p className="mt-2 text-xs text-[var(--tg-muted)]">
          {formatJournalDayLabel(overviewDraftPreview.startedAtMs)} · {formatJournalTime(overviewDraftPreview.startedAtMs)}
        </p>
        <div className="mt-4 flex flex-col gap-3">
          <button type="button" className={`${btnGradientStart} w-full`} onClick={handleDraftContinue}>
            <IconPlay />
            Продолжить
          </button>
          <Link href="/schedule" prefetch={false} className={btnHeroSecondary}>
            Открыть график
          </Link>
          <button
            type="button"
            className="text-center text-xs font-medium text-[var(--tg-muted)] underline"
            onClick={() => clearOverviewWorkoutDraft()}
          >
            Удалить черновик
          </button>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-[var(--tg-muted)]">
          Черновик действует до закрытия вкладки браузера.
        </p>
      </div>
    ) : null;

  const todayHeadBlock = (
    <>
      <div className={labelToday}>
        <IconCalendar className="text-[var(--brand-solid)]" />
        Сегодня
      </div>
      {todayProgressSplit ? (
        <div className="mt-3 flex flex-wrap items-end gap-x-2 gap-y-1">
          <span className="font-display text-3xl font-bold tabular-nums leading-none tracking-tight text-[var(--text-primary)] sm:text-4xl">
            {todayProgressSplit.completed}
          </span>
          <span className="pb-0.5 text-sm font-medium tabular-nums text-[var(--text-muted)] sm:text-base">
            {todayProgressSplit.suffix}
          </span>
        </div>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
          {calmDayNoSchedule ? "На сегодня в графике нет активных записей." : "Прогресс за сегодня недоступен."}
        </p>
      )}
    </>
  );

  const emptyNoNext = (
    <div className="min-w-0">
      <p className="text-base font-semibold text-[var(--text-primary)]">Сегодня записей нет</p>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">Запланируйте занятие в графике или начните тренировку без записи.</p>
      <div className="mt-4 flex min-w-0 flex-col gap-3">
        <Link href="/schedule" prefetch={false} className={btnHeroSecondary}>
          <IconCalendar className="text-[var(--brand-solid)]" />
          Запланировать тренировку
        </Link>
        <Link href="/start-workout" prefetch={false} className={btnHeroSecondary}>
          Начать без записи
        </Link>
      </div>
    </div>
  );

  return (
    <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-3 px-4 py-3 pb-3 sm:gap-4 sm:py-4">
      <header className="flex shrink-0 min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-[var(--tg-muted)]">Добрый день,</p>
          <h1 className="font-display text-[1.75rem] font-bold leading-tight tracking-tight text-[var(--text-primary)] sm:text-3xl">
            {trainerDisplayName}
          </h1>
        </div>
        <Link
          href="/profile"
          prefetch={false}
          className="flex h-12 w-12 min-h-[48px] min-w-[48px] shrink-0 items-center justify-center rounded-full border border-[color:var(--border-violet-soft)] bg-[color:color-mix(in_srgb,var(--bg-card),transparent_25%)] font-display text-sm font-bold text-[var(--text-primary)] shadow-[0_0_28px_rgba(168,85,247,0.22)] backdrop-blur-sm"
          aria-label="Профиль"
        >
          {trainerInitial}
        </Link>
      </header>

      {expiredPaywallBanner}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 sm:gap-4">
        {draftBlock}

        {nextSlot != null ? (
          <section className="premium-surface shrink-0 min-w-0 p-4 sm:p-5" aria-label="Следующая запись">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-[var(--brand-solid)] sm:text-xs">
                <IconBolt className="text-[var(--brand-solid)]" />
                Следующая
              </div>
              {nextDateLine ? <p className="mt-0.5 text-[11px] font-medium text-[var(--text-muted)] sm:text-xs">{nextDateLine}</p> : null}
              <p className="mt-1.5 min-w-0 break-words font-display text-[15px] font-bold leading-snug tracking-tight text-[var(--text-primary)] sm:text-base">
                <span className="tabular-nums">{nextSlot.time}</span>
                <span className="font-medium text-[var(--text-muted)]"> · </span>
                <span>{nextSlot.clientName}</span>
              </p>
              <p className="mt-0.5 min-w-0 break-words text-[11px] leading-snug text-[var(--text-secondary)] sm:text-xs">
                {nextSessionSubtitle(nextSlot)}
              </p>
            </div>

            {overviewDraftPreview == null ? (
              <div className="mt-4 flex min-w-0 flex-nowrap items-stretch gap-3">
                <Link href={nextStartHref} prefetch={false} className={btnGradientStart}>
                  <IconPlay />
                  Начать
                </Link>
                <button
                  type="button"
                  className={btnAiCompact}
                  title="AI-подготовка"
                  aria-label="AI-подготовка"
                  onClick={() => setAiSheetOpen(true)}
                >
                  <IconSparkle />
                  <span className="font-display text-[10px] font-bold leading-none tracking-wide text-[var(--text-secondary)]">
                    AI
                  </span>
                </button>
              </div>
            ) : (
              <p className="mt-4 text-xs leading-relaxed text-[var(--tg-muted)] sm:text-sm">
                Сначала завершите черновик выше — затем можно начать по записи.
              </p>
            )}
          </section>
        ) : overviewDraftPreview != null ? (
          <div className="premium-surface shrink-0 min-w-0 p-4 sm:p-5">
            <p className="text-sm text-[var(--tg-muted)]">Сначала завершите черновик выше.</p>
          </div>
        ) : (
          <div className="premium-surface shrink-0 min-w-0 p-4 sm:p-5">{emptyNoNext}</div>
        )}

        <div className="premium-surface shrink-0 min-w-0 p-4 sm:p-5">{todayHeadBlock}</div>

        <section className="premium-surface shrink-0 min-w-0 p-4 sm:p-5" aria-label="Сводка дня">
          <p className="text-xs font-semibold tracking-wide text-[var(--brand-solid)] sm:text-[13px]">Сводка дня</p>
          <p className="mt-2 min-w-0 text-sm leading-relaxed text-[var(--text-primary)] sm:text-base">
            <span className="font-display text-lg font-bold tabular-nums sm:text-xl">{scheduleRollup.completedSlots}</span>
            <span className="text-[var(--text-secondary)]"> проведено</span>
            <span className="text-[var(--text-muted)]"> · </span>
            <span className="font-display text-lg font-bold tabular-nums sm:text-xl">{scheduleRollup.pendingSlots}</span>
            <span className="text-[var(--text-secondary)]"> впереди</span>
            <span className="text-[var(--text-muted)]"> · </span>
            <span
              className={`font-display text-lg font-bold tabular-nums sm:text-xl ${
                debtClientsCount > 0 ? "text-[var(--warning)]" : "text-[var(--text-primary)]"
              }`}
            >
              {debtClientsCount}
            </span>
            <span className="text-[var(--text-secondary)]"> долгов</span>
          </p>
        </section>

        {laterSlots.length > 0 ? (
          <section
            className="premium-surface shrink-0 min-w-0 p-4 sm:p-5"
            aria-label="Следующие записи на сегодня"
          >
            <div className="flex items-center gap-1.5">
              <IconClock className="h-4 w-4 shrink-0 text-[var(--brand-solid)]" />
              <p className="text-sm font-semibold leading-tight text-[var(--text-primary)]">Дальше сегодня</p>
            </div>
            <ul className="mt-2 divide-y divide-[color:var(--border-soft)]">
              {laterSlots.map((slot) => {
                const href = `/start-workout?clientId=${encodeURIComponent(slot.clientId)}&scheduleItemId=${encodeURIComponent(slot.id)}`;
                return (
                  <li key={slot.id}>
                    <Link
                      href={href}
                      prefetch={false}
                      className="flex min-w-0 items-center gap-2 py-2.5 transition-opacity active:opacity-80"
                    >
                      <span className="w-14 shrink-0 pt-px font-display text-sm font-bold tabular-nums text-[var(--text-primary)]">
                        {slot.time}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-snug text-[var(--text-primary)]">{slot.clientName}</p>
                        <p className="mt-0.5 text-xs leading-snug text-[var(--text-secondary)]">{slotRowSecondLine(slot)}</p>
                      </div>
                      <IconChevronRight className="h-4 w-4 shrink-0 opacity-50" />
                    </Link>
                  </li>
                );
              })}
            </ul>
            {laterHiddenCount > 0 ? (
              <p className="mt-1.5 text-center text-[11px] font-medium leading-tight text-[var(--tg-muted)]">
                Ещё {laterHiddenCount} в графике
              </p>
            ) : null}
            <Link href="/schedule" prefetch={false} className={`${btnHeroSecondaryCompact} mt-3`}>
              <IconCalendar className="text-[var(--brand-solid)]" />
              Открыть график
            </Link>
          </section>
        ) : null}
      </div>

      {aiSheetOpen && nextSlot != null && overviewDraftPreview == null ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="overview-ai-sheet-title">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            aria-label="Закрыть"
            onClick={closeAiSheet}
          />
          <div className="relative z-10 w-full max-w-[min(100%,480px)] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-0 sm:pb-0">
            <p id="overview-ai-sheet-title" className="sr-only">
              Перед тренировкой
            </p>
            <div className="max-h-[85dvh] overflow-y-auto rounded-t-2xl sm:max-h-[90dvh] sm:rounded-2xl">
              <ContextualAiHelper
                heading="Перед тренировкой"
                facts={aiFacts}
                generateKind="pre_workout_hint"
                generateLabel="Сформулировать подсказку"
                showShorterSofter
                variant="preWorkout"
              />
            </div>
            <button
              type="button"
              className="app-btn mt-2 w-full rounded-xl border border-[color:var(--border-soft)] bg-[var(--bg-card)] py-2.5 text-sm font-semibold text-[var(--text-primary)] sm:mt-3"
              onClick={closeAiSheet}
            >
              Закрыть
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
