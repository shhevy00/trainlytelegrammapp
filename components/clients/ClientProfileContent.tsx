"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactElement } from "react";
import { Card } from "@/components/ui/card";
import { ContextualAiHelper } from "@/components/ai/ContextualAiHelper";
import {
  buildInactiveClientFacts,
  buildPaymentReminderFacts,
  buildPulseFactsCompactForProfile,
} from "@/lib/ai/ruleFacts";
import {
  coachClientSessionsBalanceShortRu,
  coachPaidSessionsHeadlineRu,
  coachPaidSessionsLabelRu,
  resolveCoachPaidSessionsState,
} from "@/lib/coach/paidSessions";
import {
  computeProfileProgressDashboard,
  formatLastWorkoutRelative,
  type ProfilePeriodKey,
} from "@/lib/clients/profileProgress";
import { buildClientPulseCompact } from "@/lib/mock/clientPulse";
import {
  formatScheduleSlotHuman,
  getPlanSlotsForClientOnDate,
  getUpcomingSlotsForClientFromDate,
  resolveClientProfileScenario,
} from "@/lib/mock/clientProfileScenario";
import { useMockApp } from "@/lib/mock/MockAppProvider";
import { formatJournalTime } from "@/lib/mock/journalSeed";
import { formatOverviewHumanDate } from "@/lib/overview/dailyOperations";
import type { JournalCompletedWorkout } from "@/lib/types";

const TAB_IDS = ["pulse", "progress", "history", "payments"] as const;
type ProfileTab = (typeof TAB_IDS)[number];

const TAB_LABEL: Record<ProfileTab, string> = {
  pulse: "Пульс",
  progress: "Прогресс",
  history: "История",
  payments: "Оплата",
};

const PERIOD_OPTIONS: { id: ProfilePeriodKey; label: string }[] = [
  { id: "7", label: "7 дней" },
  { id: "30", label: "30 дней" },
  { id: "90", label: "90 дней" },
  { id: "all", label: "Всё" },
];

const btnHeroPrimary =
  "app-btn min-h-[44px] w-full rounded-2xl bg-[var(--tg-accent)] px-4 py-3.5 text-center text-[15px] font-semibold text-white shadow-app-primary";
const btnSecondary =
  "app-btn w-full rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-4 py-2.5 text-center text-sm font-medium text-[var(--text-primary)]";
function shortLimit(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

interface ClientProfileContentProps {
  clientId: string;
}

export function ClientProfileContent({ clientId }: ClientProfileContentProps): ReactElement {
  const router = useRouter();
  const [tab, setTab] = useState<ProfileTab>("pulse");
  const [progressPeriod, setProgressPeriod] = useState<ProfilePeriodKey>("30");
  const [pulseDetailsOpen, setPulseDetailsOpen] = useState(false);

  const {
    todayIso,
    clients,
    scheduleItems,
    prepareRepeatFromWorkout,
    getLatestCompletedWorkoutWithStructure,
    getJournalEntriesForClient,
    getCoachQuickNotesForClient,
    getCoachPaymentRecordsForClient,
    getTemplatesForClient,
  } = useMockApp();

  const client = useMemo(() => clients.find((c) => c.id === clientId), [clients, clientId]);

  const todaySlots = useMemo(
    () => getPlanSlotsForClientOnDate(scheduleItems, clientId, todayIso),
    [scheduleItems, clientId, todayIso],
  );

  const upcomingSlots = useMemo(
    () => getUpcomingSlotsForClientFromDate(scheduleItems, clientId, todayIso),
    [scheduleItems, clientId, todayIso],
  );

  const nextSlot = upcomingSlots[0];

  const clientJournal = useMemo(() => getJournalEntriesForClient(clientId), [getJournalEntriesForClient, clientId]);

  const journalWorkoutCount = useMemo(
    () => clientJournal.filter((e) => e.kind === "workout").length,
    [clientJournal],
  );

  const latestJournalWorkout = useMemo((): JournalCompletedWorkout | null => {
    const ws = clientJournal.filter((e): e is JournalCompletedWorkout => e.kind === "workout");
    if (ws.length === 0) return null;
    return ws.reduce((a, b) => (a.createdAtMs >= b.createdAtMs ? a : b));
  }, [clientJournal]);

  const lastWorkoutAtMs = useMemo(() => {
    let max = 0;
    for (const e of clientJournal) {
      if (e.kind === "workout" && e.createdAtMs > max) max = e.createdAtMs;
    }
    return max > 0 ? max : null;
  }, [clientJournal]);

  const scenario = client ? resolveClientProfileScenario(client) : "normal";

  const coachQuickNotes = useMemo(
    () => getCoachQuickNotesForClient(clientId),
    [getCoachQuickNotesForClient, clientId],
  );

  const coachPaymentLedger = useMemo(
    () => getCoachPaymentRecordsForClient(clientId),
    [getCoachPaymentRecordsForClient, clientId],
  );

  const paymentQuickNotes = useMemo(
    () => coachQuickNotes.filter((n) => n.type === "payment"),
    [coachQuickNotes],
  );

  const progressQuickNotes = useMemo(
    () => coachQuickNotes.filter((n) => n.type === "progress"),
    [coachQuickNotes],
  );

  const pulseFactsForAi = useMemo(() => {
    if (!client) return [];
    return buildPulseFactsCompactForProfile(client);
  }, [client]);

  const inactiveFactsForAi = useMemo(() => {
    if (!client || client.inactiveDays < 10) return [];
    return buildInactiveClientFacts(client);
  }, [client]);

  const paymentReminderFactsForAi = useMemo(() => {
    if (!client || resolveCoachPaidSessionsState(client.remainingSessions) === "paid_stable") return null;
    return buildPaymentReminderFacts(client);
  }, [client]);

  const startHref = `/start-workout?clientId=${encodeURIComponent(clientId)}`;
  const addPaymentHref = `/add-payment?clientId=${encodeURIComponent(clientId)}`;
  const quickNoteHref = `/quick-note?clientId=${encodeURIComponent(clientId)}`;
  const scheduleHref = "/schedule";
  const templatesHref = `/clients/${encodeURIComponent(clientId)}/templates`;
  const activeTemplatesCount = useMemo(
    () => getTemplatesForClient(clientId).length,
    [getTemplatesForClient, clientId],
  );

  const pulseCompact = useMemo(() => {
    if (!client) return null;
    return buildClientPulseCompact({
      client,
      scenario,
      todaySlots,
      nextSlot,
      quickNotes: coachQuickNotes,
      lastWorkoutAtMs,
      journalCompletedWorkouts: journalWorkoutCount,
      mockTodayIso: todayIso,
      startWorkoutHref: startHref,
      addPaymentHref,
      quickNoteHref,
    });
  }, [
    client,
    scenario,
    todaySlots,
    nextSlot,
    coachQuickNotes,
    lastWorkoutAtMs,
    journalWorkoutCount,
    todayIso,
    startHref,
    addPaymentHref,
    quickNoteHref,
  ]);

  const progressDashboard = useMemo(() => {
    if (!client) return null;
    return computeProfileProgressDashboard(client.id, client.remainingSessions, clientJournal, progressPeriod, todayIso);
  }, [client, clientJournal, progressPeriod, todayIso]);

  const latestStructured = useMemo(() => getLatestCompletedWorkoutWithStructure(clientId), [
    getLatestCompletedWorkoutWithStructure,
    clientId,
  ]);

  const onRepeatPrevious = (): void => {
    if (!latestStructured) return;
    const ok = prepareRepeatFromWorkout(latestStructured.id);
    if (ok) router.push("/workout");
  };

  if (!client) {
    return (
      <main className="flex w-full flex-col gap-4 px-4 py-6">
        <Card>
          <h1 className="font-display text-lg font-semibold">Клиент не найден</h1>
          <p className="mt-2 text-sm text-[var(--tg-muted)]">Нет клиента с таким идентификатором.</p>
          <Link href="/clients" className="mt-4 inline-block text-sm font-semibold text-[var(--tg-accent)]" prefetch={false}>
            К списку клиентов
          </Link>
        </Card>
      </main>
    );
  }

  const paidState = resolveCoachPaidSessionsState(client.remainingSessions);
  const paidHeadline = coachPaidSessionsHeadlineRu(paidState, client.remainingSessions);

  const maxWeekCount = progressDashboard ? Math.max(1, ...progressDashboard.weekBars.map((w) => w.count)) : 1;
  const maxVol = progressDashboard ? Math.max(1, ...progressDashboard.volumeBars.map((v) => v.volumeKg)) : 1;
  const progressPeriodLabel =
    progressPeriod === "7" ? "7 дней" : progressPeriod === "30" ? "30 дней" : progressPeriod === "90" ? "90 дней" : "всё время";

  return (
    <main className="flex w-full flex-col gap-4 px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
      <header>
        <Link href="/clients" className="text-sm text-[var(--tg-accent)]" prefetch={false}>
          ← Клиенты
        </Link>
      </header>

      <Card className="border-0 bg-[color:color-mix(in_srgb,var(--bg-card-elevated),transparent_12%)] p-5 shadow-sm">
        <p className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">{client.name}</p>

        {scenario === "workout_today" ? (
          <div className="mt-3 flex flex-col gap-3">
            <p className="text-lg font-semibold leading-snug text-[var(--text-primary)]">
              {todaySlots[0]
                ? formatScheduleSlotHuman(todaySlots[0], todayIso)
                : nextSlot
                  ? formatScheduleSlotHuman(nextSlot, todayIso)
                  : "Сегодня — уточните время в графике"}
            </p>
            <p className="text-sm text-[var(--tg-muted)]">
              {coachClientSessionsBalanceShortRu(client.remainingSessions)}
              {client.limitation ? ` · ${shortLimit(client.limitation, 32)}` : ""}
            </p>
            <div className="flex flex-col gap-2">
              <Link href={startHref} prefetch={false} className={btnHeroPrimary}>
                Начать
              </Link>
              {latestStructured ? (
                <button type="button" className={btnSecondary} onClick={onRepeatPrevious}>
                  Повторить
                </button>
              ) : (
                <p className="text-center text-xs text-[var(--tg-muted)]">
                  Повтор прошлой тренировки — когда в журнале появится запись с упражнениями.
                </p>
              )}
            </div>
          </div>
        ) : null}

        {scenario === "inactive" ? (
          <div className="mt-3 flex flex-col gap-3">
            <p className="text-lg font-semibold text-[var(--text-primary)]">{client.inactiveDays} дней без тренировок</p>
            {client.goal ? <p className="text-sm text-[var(--tg-muted)]">{shortLimit(client.goal, 80)}</p> : null}
            {client.limitation ? (
              <p className="text-sm text-[var(--tg-muted)]">Ограничение: {shortLimit(client.limitation, 48)}</p>
            ) : null}
            <div className="flex flex-col gap-2">
              <Link href={quickNoteHref} prefetch={false} className={btnHeroPrimary}>
                Написать
              </Link>
              <Link href={scheduleHref} prefetch={false} className={btnSecondary}>
                Запланировать
              </Link>
            </div>
          </div>
        ) : null}

        {scenario === "no_next_workout" ? (
          <div className="mt-3 flex flex-col gap-3">
            <p className="text-lg font-semibold text-[var(--text-primary)]">Нет следующей записи</p>
            <div className="flex flex-col gap-2">
              <Link href={scheduleHref} prefetch={false} className={btnHeroPrimary}>
                Запланировать
              </Link>
              <Link href={startHref} prefetch={false} className={btnSecondary}>
                Начать
              </Link>
            </div>
          </div>
        ) : null}

        {scenario === "zero_sessions" ? (
          <div className="mt-3 flex flex-col gap-3">
            <p className="text-lg font-semibold text-[var(--text-primary)]">Осталось занятий: 0</p>
            <p className="text-sm text-[var(--tg-muted)]">Добавьте оплату или ведите занятия в долг.</p>
            <div className="flex flex-col gap-2">
              <Link href={addPaymentHref} prefetch={false} className={btnHeroPrimary}>
                Добавить оплату
              </Link>
              <Link href={quickNoteHref} prefetch={false} className={btnSecondary}>
                Напомнить
              </Link>
            </div>
          </div>
        ) : null}

        {scenario === "debt" ? (
          <div className="mt-3 flex flex-col gap-3">
            <p className="text-lg font-semibold text-[var(--danger)]">{coachClientSessionsBalanceShortRu(client.remainingSessions)}</p>
            <p className="text-sm text-[var(--tg-muted)]">
              Примите оплату или продолжайте фиксировать перерасход. Каждая завершённая тренировка уменьшает остаток на 1
              занятие.
            </p>
            <div className="flex flex-col gap-2">
              <Link href={addPaymentHref} prefetch={false} className={btnHeroPrimary}>
                Добавить оплату
              </Link>
              <Link href={startHref} prefetch={false} className={btnSecondary}>
                Начать тренировку
              </Link>
            </div>
          </div>
        ) : null}

        {scenario === "normal" ? (
          <div className="mt-3 flex flex-col gap-3">
            {nextSlot ? (
              <p className="text-base font-medium text-[var(--text-primary)]">
                Дальше: {formatScheduleSlotHuman(nextSlot, todayIso)}
              </p>
            ) : client.goal ? (
              <p className="text-sm text-[var(--tg-text)]">Цель: {shortLimit(client.goal, 100)}</p>
            ) : (
              <p className="text-sm text-[var(--tg-muted)]">Продолжайте по плану</p>
            )}
            <p className="text-sm text-[var(--tg-muted)]">
              {coachClientSessionsBalanceShortRu(client.remainingSessions)}
            </p>
            {client.lastWorkoutSummary ? (
              <p className="text-sm text-[var(--tg-muted)]">
                Последняя: <span className="text-[var(--tg-text)]">{client.lastWorkoutSummary}</span>
              </p>
            ) : null}
            <div className="flex flex-col gap-2">
              <Link href={startHref} prefetch={false} className={btnHeroPrimary}>
                {client.completedWorkoutsCount === 0 && journalWorkoutCount === 0 ? "Первая тренировка" : "Начать"}
              </Link>
              <div className="flex flex-col gap-2 sm:flex-row">
                {latestStructured ? (
                  <button type="button" className={`flex-1 ${btnSecondary}`} onClick={onRepeatPrevious}>
                    Повторить
                  </button>
                ) : null}
                <Link href={quickNoteHref} prefetch={false} className={`flex-1 ${btnSecondary} text-center`}>
                  Заметка
                </Link>
              </div>
              {!latestStructured ? (
                <p className="text-center text-xs text-[var(--tg-muted)]">
                  Повтор — когда в журнале будет тренировка с упражнениями.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </Card>

      <Link
        href={templatesHref}
        prefetch={false}
        className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--border-soft)] bg-[var(--bg-card-elevated)] px-4 py-3 transition hover:border-[color:color-mix(in_srgb,var(--brand-solid),transparent_55%)]"
      >
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--tg-muted)]">Шаблоны тренировки</p>
          <p className="mt-0.5 truncate text-sm font-medium text-[var(--text-primary)]">
            {activeTemplatesCount === 0
              ? "Пока нет шаблонов"
              : `${activeTemplatesCount} ${activeTemplatesCount === 1 ? "шаблон" : activeTemplatesCount >= 2 && activeTemplatesCount <= 4 ? "шаблона" : "шаблонов"}`}
          </p>
        </div>
        <span className="shrink-0 rounded-xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)]">
          Открыть
        </span>
      </Link>

      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-[color:var(--border-soft)] bg-[var(--bg-card-elevated)] p-1">
        {TAB_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`min-w-0 flex-1 shrink-0 rounded-xl px-3 py-2 text-xs font-semibold sm:text-sm ${
              tab === id ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-muted)]"
            }`}
          >
            {TAB_LABEL[id]}
          </button>
        ))}
      </div>

      {tab === "pulse" && pulseCompact ? (
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">Пульс клиента</h2>
            <p className="mt-1 text-sm text-[var(--tg-muted)]">Кратко: что важно перед следующей тренировкой.</p>
          </div>

          <Card className="border-0 bg-[var(--tg-card)]/90 p-4 shadow-none">
            <p className="text-base leading-snug text-[var(--text-primary)]">{pulseCompact.mainNow}</p>

            {pulseCompact.chips.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {pulseCompact.chips.map((c, idx) => (
                  <span
                    key={`${idx}-${c.slice(0, 24)}`}
                    className="rounded-full border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3 py-1 text-xs font-medium text-[var(--text-primary)]"
                  >
                    {c}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-5 border-t border-[color:var(--border-soft)] pt-4">
              <div className="flex flex-col gap-2">
                <Link href={pulseCompact.primaryAction.href} prefetch={false} className={btnHeroPrimary}>
                  {pulseCompact.primaryAction.label}
                </Link>
                {pulseCompact.secondaryAction ? (
                  <Link href={pulseCompact.secondaryAction.href} prefetch={false} className={btnSecondary}>
                    {pulseCompact.secondaryAction.label}
                  </Link>
                ) : null}
              </div>
            </div>
          </Card>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <Link href={quickNoteHref} prefetch={false} className="font-medium text-[var(--tg-accent)]">
              Добавить заметку
            </Link>
            {client.remainingSessions <= 0 ? (
              <Link href={addPaymentHref} prefetch={false} className="font-medium text-[var(--tg-accent)]">
                Добавить оплату
              </Link>
            ) : null}
          </div>

          <button
            type="button"
            className="flex w-full items-center justify-between rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3 py-2 text-left text-sm font-medium text-[var(--text-primary)]"
            onClick={() => setPulseDetailsOpen((o) => !o)}
            aria-expanded={pulseDetailsOpen}
          >
            Подробности
            <span className="text-[var(--tg-muted)]">{pulseDetailsOpen ? "▲" : "▼"}</span>
          </button>

          {pulseDetailsOpen ? (
            <div className="flex flex-col gap-3">
              {pulseCompact.detailBuckets.map((b) => (
                <Card key={b.id} className="border-0 bg-[var(--tg-card)]/80 p-4 shadow-none">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--tg-muted)]">{b.title}</p>
                  <ul className="mt-2 space-y-1.5 text-sm text-[var(--tg-text)]">
                    {b.lines.map((line, i) => (
                      <li key={`${b.id}-${i}`}>{line}</li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          ) : null}

          <details className="rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-card)]/60 px-3 py-2">
            <summary className="cursor-pointer text-sm font-medium text-[var(--text-muted)]">
              ИИ-подсказки (по желанию, не отправляются)
            </summary>
            <div className="mt-3 flex flex-col gap-3 pb-1">
              <ContextualAiHelper
                variant="compact"
                heading="Сформулировать резюме"
                facts={pulseFactsForAi}
                generateKind="pulse_summary"
                generateLabel="Сформулировать"
              />
              {inactiveFactsForAi.length > 0 ? (
                <ContextualAiHelper
                  variant="compact"
                  heading="Текст для клиента (черновик)"
                  facts={inactiveFactsForAi}
                  generateKind="inactive_client_outreach"
                  generateLabel="Сформулировать"
                />
              ) : null}
            </div>
          </details>
        </div>
      ) : null}

      {tab === "progress" && progressDashboard ? (
        <div className="flex flex-col gap-4">
          {journalWorkoutCount === 0 ? (
            <>
              <Card className="border-0 bg-[var(--tg-card)]/90 p-5 shadow-none">
                <p className="font-display text-lg font-semibold text-[var(--text-primary)]">Пока нет тренировок</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--tg-muted)]">
                  После 2–3 занятий здесь появится динамика.
                </p>
              </Card>
              <Link href={startHref} prefetch={false} className={btnHeroPrimary + " text-center"}>
                Начать тренировку
              </Link>
            </>
          ) : journalWorkoutCount >= 1 && journalWorkoutCount <= 2 ? (
            <>
              <div className="flex flex-wrap gap-2">
                {PERIOD_OPTIONS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProgressPeriod(p.id)}
                    className={`app-btn rounded-full px-3 py-1.5 text-xs font-semibold ${
                      progressPeriod === p.id
                        ? "bg-[var(--tg-accent)] text-white"
                        : "border border-[color:var(--border-strong)] bg-[var(--tg-bg)] text-[var(--text-primary)]"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <Card className="border-0 bg-[var(--tg-card)]/90 p-5 shadow-none">
                <p className="font-display text-lg font-semibold text-[var(--text-primary)]">Пока мало данных</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--tg-muted)]">
                  Проведите ещё несколько тренировок, чтобы увидеть динамику.
                </p>
                <p className="mt-4 text-sm text-[var(--tg-text)]">
                  Завершено в журнале:{" "}
                  <span className="font-semibold tabular-nums">{journalWorkoutCount}</span>
                </p>
                {latestJournalWorkout ? (
                  <p className="mt-2 text-sm text-[var(--tg-muted)]">
                    Последняя запись:{" "}
                    <span className="font-medium text-[var(--tg-text)]">{latestJournalWorkout.title}</span>
                    {" · "}
                    {formatLastWorkoutRelative(latestJournalWorkout.createdAtMs, todayIso)}
                  </p>
                ) : null}
                {(client.remainingSessions <= 2 || client.remainingSessions < 0) && (
                  <p className="mt-2 text-sm text-[var(--tg-muted)]">
                    Оплаченных занятий:{" "}
                    <span className="font-semibold text-[var(--tg-text)]">{client.remainingSessions}</span>
                    {" — "}
                    <button
                      type="button"
                      className="font-medium text-[var(--tg-accent)] underline-offset-2 hover:underline"
                      onClick={() => setTab("payments")}
                    >
                      подробнее во вкладке «Оплата»
                    </button>
                  </p>
                )}
              </Card>
            </>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {PERIOD_OPTIONS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProgressPeriod(p.id)}
                    className={`app-btn rounded-full px-3 py-1.5 text-xs font-semibold ${
                      progressPeriod === p.id
                        ? "bg-[var(--tg-accent)] text-white"
                        : "border border-[color:var(--border-strong)] bg-[var(--tg-bg)] text-[var(--text-primary)]"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <p className="text-sm text-[var(--tg-muted)]">
                За {progressPeriodLabel}:{" "}
                <span className="font-semibold text-[var(--text-primary)]">{progressDashboard.workoutsInPeriod}</span>{" "}
                {(() => {
                  const n = progressDashboard.workoutsInPeriod;
                  if (n === 1) return "тренировка";
                  if (n >= 2 && n <= 4) return "тренировки";
                  return "тренировок";
                })()}
              </p>

              <div className="grid grid-cols-3 gap-2">
                <Card className="border-0 bg-[var(--tg-card)]/90 p-3 shadow-none">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--tg-muted)]">Тренировок</p>
                  <p className="mt-1 font-display text-xl font-bold tabular-nums">{progressDashboard.workoutsInPeriod}</p>
                </Card>
                <Card className="border-0 bg-[var(--tg-card)]/90 p-3 shadow-none">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--tg-muted)]">Частота / нед</p>
                  <p className="mt-1 font-display text-xl font-bold tabular-nums">{progressDashboard.workoutsPerWeek}</p>
                </Card>
                <Card className="border-0 bg-[var(--tg-card)]/90 p-3 shadow-none">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--tg-muted)]">Последняя</p>
                  <p className="mt-1 text-sm font-semibold leading-tight text-[var(--text-primary)]">
                    {progressDashboard.lastWorkoutRelative ?? "—"}
                  </p>
                </Card>
              </div>

              {!progressDashboard.showCharts ? (
                <Card className="border-0 bg-[var(--tg-card)]/90 p-4 shadow-none">
                  <p className="text-sm leading-relaxed text-[var(--tg-muted)]">
                    В выбранном периоде пока мало тренировок для графика. Смените период или проведите ещё занятия.
                  </p>
                </Card>
              ) : (
                <>
                  <Card className="border-0 bg-[var(--tg-card)]/90 p-4 shadow-none">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--tg-muted)]">Тренировки по неделям</p>
                    <div className="mt-4 flex h-24 items-end justify-between gap-1">
                      {progressDashboard.weekBars.map((w) => (
                        <div key={w.key} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                          <div
                            className="w-full max-w-[14px] rounded-t bg-[color:color-mix(in_srgb,var(--tg-accent),transparent_35%)]"
                            style={{ height: `${4 + (w.count / maxWeekCount) * 52}px` }}
                            title={`${w.label}: ${w.count}`}
                          />
                          <span className="truncate text-[9px] text-[var(--tg-muted)]">{w.label}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="border-0 bg-[var(--tg-card)]/90 p-4 shadow-none">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--tg-muted)]">Упражнение</p>
                    {progressDashboard.exerciseTrend ? (
                      <div className="mt-3">
                        <p className="font-medium text-[var(--text-primary)]">{progressDashboard.exerciseTrend.name}</p>
                        <p className="mt-1 text-xs text-[var(--tg-muted)]">{progressDashboard.exerciseTrend.lastLabel}</p>
                        <p className="text-xs text-[var(--tg-muted)]">{progressDashboard.exerciseTrend.bestLabel}</p>
                        <div className="mt-3 flex h-14 items-end gap-0.5">
                          {progressDashboard.exerciseTrend.normalizedSeries.map((h, i) => (
                            <div
                              key={`ex-${i}`}
                              className="flex-1 rounded-t bg-[var(--tg-accent)]"
                              style={{ height: `${4 + h * 44}px`, opacity: 0.35 + h * 0.65 }}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm leading-relaxed text-[var(--tg-muted)]">
                        Пока мало данных для графика. Проведите 2–3 тренировки, и здесь появится динамика.
                      </p>
                    )}
                  </Card>

                  <Card className="border-0 bg-[var(--tg-card)]/90 p-4 shadow-none">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--tg-muted)]">Объём</p>
                    {progressDashboard.hasVolumeInPeriod ? (
                      <div className="mt-4 flex h-20 items-end justify-between gap-1">
                        {progressDashboard.volumeBars.map((v) => (
                          <div key={v.key} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                            <div
                              className="w-full max-w-[14px] rounded-t bg-[color:color-mix(in_srgb,var(--brand-solid),transparent_40%)]"
                              style={{ height: `${4 + (v.volumeKg / maxVol) * 48}px` }}
                              title={`${v.label}: ${v.volumeKg} кг`}
                            />
                            <span className="truncate text-[9px] text-[var(--tg-muted)]">{v.label}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-[var(--tg-muted)]">
                        Объём не рассчитан — добавьте вес и повторения в подходах.
                      </p>
                    )}
                  </Card>
                </>
              )}

              {progressQuickNotes.length > 0 ? (
                <Card className="border-0 bg-[var(--tg-card)]/90 p-4 shadow-none">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--tg-muted)]">Заметки о прогрессе</p>
                  <ul className="mt-2 space-y-2 text-sm text-[var(--tg-text)]">
                    {progressQuickNotes.map((n) => (
                      <li key={n.id} className="rounded-lg bg-[var(--tg-bg)] px-3 py-2">
                        <span className="text-xs text-[var(--tg-muted)]">
                          {formatLastWorkoutRelative(n.createdAtMs, todayIso)} · {formatJournalTime(n.createdAtMs)}
                        </span>
                        <p className="mt-1">{n.text.trim()}</p>
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {tab === "history" ? (
        <div className="flex flex-col gap-3">
          {clientJournal.length === 0 ? (
            <Card className="flex flex-col gap-3 border-0 bg-[var(--tg-card)]/90 p-4 shadow-none">
              <p className="text-sm text-[var(--tg-muted)]">Пока нет записей.</p>
              <Link href={startHref} className={btnHeroPrimary + " text-center"} prefetch={false}>
                Первая тренировка
              </Link>
              <Link href={quickNoteHref} className={btnSecondary + " text-center"} prefetch={false}>
                Быстрая заметка
              </Link>
            </Card>
          ) : (
            <ul className="flex flex-col gap-2">
              {clientJournal.map((e) => {
                const isWorkout = e.kind === "workout";
                const when = `${formatLastWorkoutRelative(e.createdAtMs, todayIso)} · ${formatJournalTime(e.createdAtMs)}`;
                return (
                  <li key={e.id}>
                    <Link
                      href={`/workouts/${e.id}`}
                      prefetch={false}
                      className={`block rounded-2xl border border-[color:var(--border-soft)] bg-[var(--tg-card)] px-4 py-3 pl-3 transition hover:border-[color:color-mix(in_srgb,var(--brand-solid),transparent_55%)] ${
                        isWorkout ? "border-l-4 border-l-[var(--tg-accent)]" : "border-l-4 border-l-[var(--tg-muted)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium text-[var(--text-primary)]">{e.title}</span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            isWorkout ? "bg-[color:color-mix(in_srgb,var(--tg-accent),transparent_88%)] text-[var(--tg-accent)]" : "bg-[var(--tg-bg)] text-[var(--tg-muted)]"
                          }`}
                        >
                          {isWorkout ? "Тренировка" : "Заметка"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--tg-muted)]">{when}</p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      {tab === "payments" ? (
        <div className="flex flex-col gap-4">
          <Card className="border-0 bg-[color:color-mix(in_srgb,var(--bg-card-elevated),transparent_10%)] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--tg-muted)]">Оплата клиента</p>
            <p
              className={`mt-2 font-display text-2xl font-bold tabular-nums ${
                client.remainingSessions < 0 ? "text-[var(--danger)]" : client.remainingSessions === 0 ? "text-[var(--warning)]" : ""
              }`}
            >
              {client.remainingSessions}
            </p>
            <p className="mt-1 text-xs text-[var(--tg-muted)]">{coachClientSessionsBalanceShortRu(client.remainingSessions)}</p>
            <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{paidHeadline}</p>
            <p className="mt-1 text-xs text-[var(--tg-muted)]">{coachPaidSessionsLabelRu(paidState)}</p>
            {client.lastPaymentSummary ? (
              <p className="mt-2 text-sm text-[var(--tg-text)]">Последняя: {client.lastPaymentSummary}</p>
            ) : null}
            <p className="mt-3 text-xs leading-relaxed text-[var(--tg-muted)]">
              Здесь учитываются оплаченные занятия клиента.
            </p>
          </Card>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href={addPaymentHref} prefetch={false} className={`flex-1 ${btnHeroPrimary} text-center`}>
              Добавить оплату
            </Link>
            <Link href={quickNoteHref} prefetch={false} className={`flex-1 ${btnSecondary} text-center`}>
              Заметка об оплате
            </Link>
          </div>

          {paymentReminderFactsForAi ? (
            <details className="rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-card)]/60 px-3 py-2">
              <summary className="cursor-pointer text-sm font-medium text-[var(--text-muted)]">Сформулировать напоминание</summary>
              <div className="mt-3 pb-1">
                <ContextualAiHelper
                  variant="compact"
                  heading="Оплата"
                  facts={paymentReminderFactsForAi}
                  generateKind="payment_reminder"
                  generateLabel="Сформулировать"
                />
              </div>
            </details>
          ) : null}

          <Card className="border-0 bg-[var(--tg-card)]/90 p-4 shadow-none">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--tg-muted)]">История оплат</p>
            {coachPaymentLedger.length === 0 &&
            (!client.paymentHistoryMock || client.paymentHistoryMock.length === 0) ? (
              <div className="mt-3 text-sm leading-relaxed text-[var(--tg-muted)]">
                <p>Оплат пока нет.</p>
                <p className="mt-2">Можно добавить оплату или вести занятия в долг.</p>
              </div>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {coachPaymentLedger.map((row) => (
                  <li key={row.id} className="rounded-xl bg-[var(--tg-bg)] px-3 py-2">
                    <span className="text-xs text-[var(--tg-muted)]">
                      {formatLastWorkoutRelative(row.createdAtMs, todayIso)} · {formatJournalTime(row.createdAtMs)}
                    </span>
                    <span className="text-[var(--tg-text)]">
                      {" "}
                      · +{row.sessionsAdded} занятий
                      {row.amountRub != null ? ` · ${row.amountRub} ₽` : ""}
                    </span>
                    {row.comment ? <p className="mt-1 text-sm text-[var(--tg-muted)]">{row.comment}</p> : null}
                  </li>
                ))}
                {client.paymentHistoryMock?.map((row) => (
                  <li key={`mock-${row.dateIso}-${row.label}`} className="rounded-xl bg-[var(--tg-bg)] px-3 py-2">
                    <span className="text-xs text-[var(--tg-muted)]">{formatOverviewHumanDate(row.dateIso, todayIso)}</span>
                    <span className="text-[var(--tg-text)]"> · {row.label}</span>
                  </li>
                )) ?? null}
              </ul>
            )}
          </Card>

          {paymentQuickNotes.length > 0 ? (
            <Card className="border-0 bg-[var(--tg-card)]/90 p-4 shadow-none">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--tg-muted)]">Заметки об оплате</p>
              <ul className="mt-3 space-y-2 text-sm">
                {paymentQuickNotes.map((n) => (
                  <li key={n.id} className="rounded-xl bg-[var(--tg-bg)] px-3 py-2 text-[var(--tg-text)]">
                    <span className="text-xs text-[var(--tg-muted)]">
                      {formatLastWorkoutRelative(n.createdAtMs, todayIso)} · {formatJournalTime(n.createdAtMs)}
                    </span>
                    <p className="mt-1">{n.text.trim()}</p>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
