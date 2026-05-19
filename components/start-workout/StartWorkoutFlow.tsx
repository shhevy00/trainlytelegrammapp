"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";
import type { WorkoutSessionState } from "@/lib/workout/types";
import { Card } from "@/components/ui/card";
import { coachClientSessionsBalanceShortRu } from "@/lib/coach/paidSessions";
import type { MockScheduleItem } from "@/lib/mock/data";
import { getRecommendedAction, type RecommendedKind } from "@/lib/mock/recommendedAction";
import { createEmptyWorkoutSessionForClient } from "@/lib/mock/startWorkoutSession";
import { useMockApp } from "@/lib/mock/MockAppProvider";
import { buildRepeatSessionFromSavedWorkout } from "@/lib/workout/repeatFromJournal";
import type { WorkoutTemplate } from "@/lib/workout/templates";
import type { JournalCompletedWorkout } from "@/lib/types";

function exerciseCountLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} упражнений`;
  if (mod10 === 1) return `${n} упражнение`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} упражнения`;
  return `${n} упражнений`;
}

function plannedRowsTotalForDisplay(t: WorkoutTemplate): number {
  return t.exercises.reduce((acc, ex) => {
    const p = ex.plannedSets;
    if (typeof p === "number" && Number.isInteger(p) && p >= 1 && p <= 20) return acc + p;
    return acc + 1;
  }, 0);
}

function plannedSetsCountLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} подходов`;
  if (mod10 === 1) return `${n} подход`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} подхода`;
  return `${n} подходов`;
}

interface StartWorkoutFlowInnerProps {
  clientIdParam: string | null;
  scheduleItemIdParam: string | null;
  modeParam: string | null;
}

function StartWorkoutFlowInner({
  clientIdParam,
  scheduleItemIdParam,
  modeParam,
}: StartWorkoutFlowInnerProps): ReactElement {
  const router = useRouter();
  const {
    clients,
    todayIso,
    queueWorkoutBootstrap,
    getLatestCompletedWorkoutWithStructure,
    getScheduleItemById,
    scheduleItems,
    getTemplatesForClient,
    getTemplateById,
    createWorkoutBootstrapFromTemplate,
    loadWorkoutDraft,
  } = useMockApp();

  const urlClientId = useMemo(() => {
    if (scheduleItemIdParam) {
      const s = getScheduleItemById(scheduleItemIdParam);
      if (s) return s.clientId;
    }
    return clientIdParam;
  }, [clientIdParam, scheduleItemIdParam, getScheduleItemById]);

  const [pickerClientId, setPickerClientId] = useState<string | null>(null);
  const selectedClientId = pickerClientId ?? urlClientId;

  const [linkNearbyChoice, setLinkNearbyChoice] = useState<null | "linked" | "separate">(null);
  const [templateStartError, setTemplateStartError] = useState<string | null>(null);
  const [plannedSlotTemplateError, setPlannedSlotTemplateError] = useState<string | null>(null);
  const [resumeDraft, setResumeDraft] = useState<{
    workoutId: string;
    session: WorkoutSessionState;
    clientName: string;
  } | null>(null);

  const refreshResumeDraft = useCallback(
    async (clientId: string | null): Promise<void> => {
      if (clientId == null) {
        setResumeDraft(null);
        return;
      }
      const draft = await loadWorkoutDraft(clientId);
      if (draft == null) {
        setResumeDraft(null);
        return;
      }
      setResumeDraft({
        workoutId: draft.workoutId,
        session: { ...draft.session, clientName: draft.clientName },
        clientName: draft.clientName,
      });
    },
    [loadWorkoutDraft],
  );

  useEffect(() => {
    if (!selectedClientId) return;
    queueMicrotask(() => {
      void refreshResumeDraft(selectedClientId);
    });
  }, [selectedClientId, refreshResumeDraft]);

  const selectedClient = useMemo(
    () => (selectedClientId ? clients.find((c) => c.id === selectedClientId) : undefined),
    [clients, selectedClientId],
  );

  const promptSlot: MockScheduleItem | undefined = useMemo(() => {
    if (scheduleItemIdParam || !selectedClientId) return undefined;
    const list = scheduleItems.filter(
      (s) =>
        s.date === todayIso &&
        s.clientId === selectedClientId &&
        (s.status === "planned" || s.status === "upcoming"),
    );
    list.sort((a, b) => a.time.localeCompare(b.time));
    return list[0];
  }, [scheduleItemIdParam, selectedClientId, scheduleItems, todayIso]);

  const resolvedScheduleItemId = useMemo((): string | undefined => {
    if (scheduleItemIdParam) {
      const s = getScheduleItemById(scheduleItemIdParam);
      if (s && (s.status === "planned" || s.status === "upcoming")) return scheduleItemIdParam;
      return undefined;
    }
    if (linkNearbyChoice === "linked" && promptSlot) return promptSlot.id;
    return undefined;
  }, [scheduleItemIdParam, linkNearbyChoice, promptSlot, getScheduleItemById]);

  const plannedContext: MockScheduleItem | undefined = useMemo(() => {
    if (!selectedClientId) return undefined;
    if (scheduleItemIdParam) {
      const s = getScheduleItemById(scheduleItemIdParam);
      if (s && s.clientId === selectedClientId && (s.status === "planned" || s.status === "upcoming")) {
        return s;
      }
      return undefined;
    }
    if (linkNearbyChoice === "linked" && promptSlot && promptSlot.clientId === selectedClientId) {
      return promptSlot;
    }
    return undefined;
  }, [selectedClientId, scheduleItemIdParam, linkNearbyChoice, promptSlot, getScheduleItemById]);

  const plannedSlotTemplateUsable = useMemo((): boolean => {
    if (!plannedContext?.templateId || !selectedClient) return false;
    const t = getTemplateById(plannedContext.templateId);
    return Boolean(t && !t.archivedAtIso && t.clientId === selectedClient.id);
  }, [plannedContext, selectedClient, getTemplateById]);

  const plannedSlotTemplateBroken = useMemo((): boolean => {
    if (!plannedContext?.templateId) return false;
    return !plannedSlotTemplateUsable;
  }, [plannedContext, plannedSlotTemplateUsable]);

  const latestStructured: JournalCompletedWorkout | undefined = useMemo(() => {
    if (!selectedClient) return undefined;
    return getLatestCompletedWorkoutWithStructure(selectedClient.id);
  }, [getLatestCompletedWorkoutWithStructure, selectedClient]);

  const clientTemplates = useMemo(
    () => (selectedClient ? getTemplatesForClient(selectedClient.id) : []),
    [getTemplatesForClient, selectedClient],
  );

  const newTemplateHref = selectedClient
    ? `/clients/${encodeURIComponent(selectedClient.id)}/templates/new`
    : "/clients";

  const recommended: { kind: RecommendedKind; label: string } | null = useMemo(() => {
    if (!selectedClient) return null;
    return getRecommendedAction(selectedClient);
  }, [selectedClient]);

  const goLogger = useCallback(
    (bootstrap: Parameters<typeof queueWorkoutBootstrap>[0]): void => {
      queueWorkoutBootstrap(bootstrap);
      router.push("/workout");
    },
    [queueWorkoutBootstrap, router],
  );

  const onStartPlanned = (): void => {
    if (!selectedClient || !plannedContext) return;
    const session = createEmptyWorkoutSessionForClient(
      selectedClient,
      `${plannedContext.title} · ${plannedContext.time}`,
      plannedContext.id,
    );
    goLogger({
      session,
      referenceHintsByExerciseName: {},
      rememberBlock: "",
      startSource: "schedule",
    });
  };

  const onRepeatPrevious = (): void => {
    if (!selectedClient || !latestStructured) return;
    const base = buildRepeatSessionFromSavedWorkout(latestStructured);
    const session =
      resolvedScheduleItemId !== undefined ? { ...base, scheduleItemId: resolvedScheduleItemId } : base;
    goLogger({
      session,
      referenceHintsByExerciseName: {},
      rememberBlock: "",
      startSource: "repeat",
    });
  };

  const onResumeDraft = (): void => {
    if (!resumeDraft || !selectedClient) return;
    goLogger({
      session: resumeDraft.session,
      referenceHintsByExerciseName: {},
      rememberBlock: "",
      startSource: "empty",
      persistedWorkoutId: resumeDraft.workoutId,
    });
  };

  const onEmptyWorkout = (): void => {
    if (!selectedClient) return;
    const session = createEmptyWorkoutSessionForClient(
      selectedClient,
      "Новая тренировка",
      resolvedScheduleItemId,
    );
    goLogger({
      session,
      referenceHintsByExerciseName: {},
      rememberBlock: "",
      startSource: resolvedScheduleItemId !== undefined ? "schedule" : "empty",
    });
  };

  const onStartFromPlannedSlotTemplate = (): void => {
    if (!selectedClient || !plannedContext?.templateId) return;
    setPlannedSlotTemplateError(null);
    const res = createWorkoutBootstrapFromTemplate({
      clientId: selectedClient.id,
      templateId: plannedContext.templateId,
      ...(resolvedScheduleItemId !== undefined ? { scheduleItemId: resolvedScheduleItemId } : {}),
      titleOverride: plannedContext.title.trim() || plannedContext.templateName,
    });
    if (!res.ok) {
      setPlannedSlotTemplateError(res.error);
      return;
    }
    router.push("/workout");
  };

  const onStartFromTemplate = (template: WorkoutTemplate): void => {
    if (!selectedClient) return;
    setTemplateStartError(null);
    const res = createWorkoutBootstrapFromTemplate({
      clientId: selectedClient.id,
      templateId: template.id,
      ...(resolvedScheduleItemId !== undefined ? { scheduleItemId: resolvedScheduleItemId } : {}),
    });
    if (!res.ok) {
      setTemplateStartError(res.error);
      return;
    }
    router.push("/workout");
  };

  const addPaymentHref = selectedClient
    ? `/add-payment?clientId=${encodeURIComponent(selectedClient.id)}`
    : "/add-payment";

  const showLinkPrompt =
    Boolean(selectedClient && promptSlot && !scheduleItemIdParam && linkNearbyChoice === null);

  return (
    <main className="flex w-full flex-col gap-4 px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight">Перед стартом</h1>
        <p className="mt-1 text-sm text-[var(--tg-muted)]">
          {modeParam === "client"
            ? "Выберите клиента — затем старт по записи или новая тренировка."
            : "Выберите клиента и способ начала."}
        </p>
      </header>

      {resumeDraft && selectedClient ? (
        <Card className="border-[color:color-mix(in_srgb,var(--brand-solid),transparent_55%)] p-3">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Незавершённая тренировка</p>
          <p className="mt-1 text-xs text-[var(--tg-muted)]">
            {resumeDraft.session.title} · {resumeDraft.clientName}
          </p>
          <button
            type="button"
            onClick={onResumeDraft}
            className="app-btn mt-3 w-full rounded-2xl bg-[var(--tg-accent)] px-4 py-3 text-sm font-semibold text-white shadow-app-primary"
          >
            Продолжить
          </button>
        </Card>
      ) : null}

      <Card className="p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--tg-muted)]">Клиент</p>
        <div className="app-scroll mt-2 max-h-52 space-y-1.5 overflow-y-auto pr-0.5">
          {clients.map((c) => {
            const active = selectedClientId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setPickerClientId(c.id);
                  setLinkNearbyChoice(null);
                  setTemplateStartError(null);
                  setPlannedSlotTemplateError(null);
                  void refreshResumeDraft(c.id);
                }}
                className={`flex w-full min-h-[44px] items-center rounded-xl border px-3 py-2.5 text-left text-[15px] font-semibold transition ${
                  active
                    ? "border-[color:color-mix(in_srgb,var(--tg-accent),transparent_45%)] bg-[color:color-mix(in_srgb,var(--tg-accent),transparent_92%)] text-[var(--text-primary)]"
                    : "border-[color:var(--border-soft)] bg-[var(--tg-bg)] text-[var(--text-primary)] hover:border-[color:color-mix(in_srgb,var(--brand-solid),transparent_55%)]"
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
        {recommended && selectedClient ? (
          <p className="mt-2 text-xs text-[var(--tg-muted)]">
            Сейчас логично: <span className="font-semibold text-[var(--tg-text)]">{recommended.label}</span>
          </p>
        ) : null}
      </Card>

      {!selectedClient ? (
        <Card>
          <p className="text-sm text-[var(--tg-muted)]">Сначала выберите клиента, чтобы увидеть контекст.</p>
        </Card>
      ) : (
        <>
          {showLinkPrompt ? (
            <Card className="border border-[color:color-mix(in_srgb,var(--brand-solid),transparent_72%)] bg-[color:color-mix(in_srgb,var(--brand-purple),transparent_94%)]">
              <p className="text-sm font-medium text-[var(--tg-text)]">Привязать тренировку к записи в графике?</p>
              <p className="mt-2 text-sm text-[var(--tg-muted)]">
                {promptSlot?.time} · {promptSlot?.title} ({promptSlot?.durationMinutes} мин)
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  className="app-btn flex-1 rounded-2xl bg-[var(--tg-accent)] px-4 py-3 text-white shadow-app-primary"
                  onClick={() => setLinkNearbyChoice("linked")}
                >
                  Привязать
                </button>
                <button
                  type="button"
                  className="app-btn flex-1 rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-4 py-3 text-[var(--text-primary)]"
                  onClick={() => setLinkNearbyChoice("separate")}
                >
                  Оставить отдельно
                </button>
              </div>
            </Card>
          ) : null}

          {plannedContext ? (
            <Card>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--tg-muted)]">В графике</p>
              <p className="mt-2 text-lg font-semibold">
                {plannedContext.time} · {plannedContext.title}
              </p>
              <p className="mt-1 text-sm text-[var(--tg-muted)]">{plannedContext.durationMinutes} мин</p>
              {plannedContext.templateName &&
              plannedContext.title.trim().toLowerCase() !== plannedContext.templateName.trim().toLowerCase() ? (
                <p className="mt-2 text-xs text-[var(--tg-muted)]">
                  Шаблон: <span className="font-medium text-[var(--tg-text)]">{plannedContext.templateName}</span>
                </p>
              ) : null}
              {plannedSlotTemplateBroken ? (
                <p className="mt-2 text-xs font-medium text-[var(--warning)]">
                  Шаблон недоступен. Можно начать с нуля по записи.
                </p>
              ) : null}
            </Card>
          ) : scheduleItemIdParam ? (
            <Card className="border-dashed border-[color:color-mix(in_srgb,var(--warning),transparent_70%)]">
              <p className="text-sm text-[var(--tg-muted)]">
                Запись в графике недоступна для этого клиента или уже завершена.
              </p>
            </Card>
          ) : null}

          <Card className="p-3">
            <p className="text-sm text-[var(--tg-text)]">
              <span
                className={`font-semibold tabular-nums ${
                  selectedClient.remainingSessions < 0
                    ? "text-[var(--danger)]"
                    : selectedClient.remainingSessions === 0
                      ? "text-[var(--warning)]"
                      : "text-[var(--text-primary)]"
                }`}
              >
                {coachClientSessionsBalanceShortRu(selectedClient.remainingSessions)}
              </span>
            </p>
            {selectedClient.lastWorkoutSummary ? (
              <p className="mt-1 text-xs text-[var(--tg-muted)]">
                Последняя: <span className="text-[var(--tg-text)]">{selectedClient.lastWorkoutSummary}</span>
              </p>
            ) : (
              <p className="mt-1 text-xs text-[var(--tg-muted)]">В журнале пока нет завершённых тренировок.</p>
            )}
            {selectedClient.remainingSessions <= 0 ? (
              <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">
                Баланс занятий нулевой или отрицательный.{" "}
                <Link href={addPaymentHref} prefetch={false} className="font-semibold text-[var(--brand-solid)] underline-offset-2">
                  Добавить оплату
                </Link>{" "}
                — по желанию; тренировку можно начать в любом случае.
              </p>
            ) : null}
          </Card>

          <section className="flex flex-col gap-2">
            {plannedContext && plannedSlotTemplateUsable ? (
              <>
                {plannedSlotTemplateError ? (
                  <p className="rounded-lg border border-[color:color-mix(in_srgb,var(--warning),transparent_45%)] bg-[color:color-mix(in_srgb,var(--warning),transparent_92%)] px-2.5 py-2 text-xs font-medium text-[var(--warning)]">
                    {plannedSlotTemplateError}
                  </p>
                ) : null}
                <button
                  type="button"
                  className="app-btn rounded-2xl bg-[var(--tg-accent)] px-4 py-3 text-white shadow-app-primary"
                  onClick={onStartFromPlannedSlotTemplate}
                >
                  Начать по шаблону
                </button>
                <button
                  type="button"
                  className="app-btn rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-4 py-3 text-[var(--text-primary)]"
                  onClick={onStartPlanned}
                >
                  Начать по записи
                </button>
              </>
            ) : plannedContext ? (
              <button
                type="button"
                className="app-btn rounded-2xl bg-[var(--tg-accent)] px-4 py-3 text-white shadow-app-primary"
                onClick={onStartPlanned}
              >
                Начать по записи
              </button>
            ) : null}

            {latestStructured ? (
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  className="app-btn rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-4 py-3 text-[var(--text-primary)]"
                  onClick={onRepeatPrevious}
                >
                  Повторить прошлую
                </button>
                <p className="px-0.5 text-center text-[11px] leading-snug text-[var(--tg-muted)]">
                  Скопирует структуру последней тренировки.
                </p>
              </div>
            ) : null}

            <Card className="p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--tg-muted)]">Шаблоны тренировки</p>
              <p className="mt-1 text-[11px] leading-snug text-[var(--tg-muted)]">Заранее сохранённая структура.</p>
              {templateStartError ? (
                <p className="mt-2 rounded-lg border border-[color:color-mix(in_srgb,var(--warning),transparent_45%)] bg-[color:color-mix(in_srgb,var(--warning),transparent_92%)] px-2.5 py-2 text-xs font-medium text-[var(--warning)]">
                  {templateStartError}
                </p>
              ) : null}
              {clientTemplates.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {clientTemplates.map((t) => {
                    const rowsTotal = plannedRowsTotalForDisplay(t);
                    return (
                      <li
                        key={t.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3 py-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{t.name}</p>
                          <p className="mt-0.5 text-[11px] text-[var(--tg-muted)]">
                            {exerciseCountLabel(t.exercises.length)} · {plannedSetsCountLabel(rowsTotal)}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="app-btn shrink-0 rounded-xl bg-[var(--tg-accent)] px-3 py-2 text-xs font-semibold text-white shadow-app-primary"
                          onClick={() => onStartFromTemplate(t)}
                        >
                          Начать
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="mt-3">
                  <p className="text-sm text-[var(--tg-text)]">Шаблонов пока нет.</p>
                  <p className="mt-1 text-xs text-[var(--tg-muted)]">
                    Создайте шаблон, чтобы быстрее начинать занятия.
                  </p>
                  <Link
                    href={newTemplateHref}
                    prefetch={false}
                    className="app-btn mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-4 py-2.5 text-center text-sm font-medium text-[var(--text-primary)]"
                  >
                    Создать шаблон
                  </Link>
                </div>
              )}
            </Card>

            <button
              type="button"
              className="app-btn rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-4 py-3 text-[var(--text-primary)]"
              onClick={onEmptyWorkout}
            >
              Новая тренировка с нуля
            </button>
          </section>

          {!latestStructured ? (
            <p className="text-xs text-[var(--tg-muted)]">
              Повтор возможен только для тренировок с сохранёнными упражнениями. Старые записи без структуры не
              подходят.
            </p>
          ) : null}

        </>
      )}
    </main>
  );
}

export function StartWorkoutFlow(): ReactElement {
  const searchParams = useSearchParams();
  const clientIdParam = searchParams.get("clientId");
  const scheduleItemIdParam = searchParams.get("scheduleItemId");
  const modeParam = searchParams.get("mode");
  const syncKey = `${clientIdParam ?? ""}|${scheduleItemIdParam ?? ""}|${modeParam ?? ""}`;

  return (
    <StartWorkoutFlowInner
      key={syncKey}
      clientIdParam={clientIdParam}
      scheduleItemIdParam={scheduleItemIdParam}
      modeParam={modeParam}
    />
  );
}
