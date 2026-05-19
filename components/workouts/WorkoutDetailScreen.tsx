"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactElement } from "react";
import { Card } from "@/components/ui/card";
import { JournalNoteEditPanel } from "@/components/workouts/JournalNoteEditPanel";
import { JournalWorkoutEditPanel } from "@/components/workouts/JournalWorkoutEditPanel";
import type { MockScheduleStatus } from "@/lib/mock/data";
import { formatJournalDayLabel, formatJournalTime } from "@/lib/mock/journalSeed";
import { useMockApp } from "@/lib/mock/MockAppProvider";
import { countJournalWorkoutExercises } from "@/lib/journal/journalEntryStats";
import { formatOverviewHumanDate } from "@/lib/overview/dailyOperations";
import type { JournalEntry } from "@/lib/types";
import { countFilledSetsInExercise, WORKOUT_VOLUME_NOT_CALCULATED_RU } from "@/lib/workout/calculations";
import { formatExerciseSetsReference, formatSetReferenceLabel } from "@/lib/workout/formatSetDisplay";

const scheduleStatusLabel: Record<MockScheduleStatus, string> = {
  planned: "Запланировано",
  upcoming: "Скоро",
  completed: "Проведено",
  missed: "Пропуск",
  cancelled: "Отменено",
};

interface WorkoutDetailScreenProps {
  workoutId: string;
}

type SaveTemplateUi = "idle" | "form" | "success";

function StatCell({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <div className="rounded-xl bg-[var(--tg-bg)] px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--tg-muted)]">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

export function WorkoutDetailScreen({ workoutId }: WorkoutDetailScreenProps): ReactElement {
  const router = useRouter();
  const {
    todayIso,
    getJournalEntry,
    prepareRepeatFromWorkout,
    getScheduleItemById,
    saveWorkoutAsTemplate,
    updateJournalWorkout,
    updateJournalNote,
  } = useMockApp();
  const [toast, setToast] = useState<string | null>(null);
  const [saveTemplateUi, setSaveTemplateUi] = useState<SaveTemplateUi>("idle");
  const [saveTemplateName, setSaveTemplateName] = useState("");
  const [saveTemplateErrors, setSaveTemplateErrors] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [editErrors, setEditErrors] = useState<string[]>([]);
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(t);
  }, [toast]);

  const entry: JournalEntry | undefined = getJournalEntry(workoutId);

  if (!entry) {
    return (
      <main className="flex w-full flex-col gap-4 px-4 py-6 pb-[calc(6rem+max(0.35rem,env(safe-area-inset-bottom,0px)))]">
        <Card>
          <h1 className="font-display text-lg font-semibold">Запись не найдена</h1>
          <p className="mt-2 text-sm text-[var(--tg-muted)]">Возможно, запись удалена или ещё не сохранена.</p>
          <Link href="/journal" className="mt-4 inline-block text-sm font-semibold text-[var(--tg-accent)]" prefetch={false}>
            Назад в журнал
          </Link>
        </Card>
      </main>
    );
  }

  const headerWhen = `${formatJournalDayLabel(entry.createdAtMs)} · ${formatJournalTime(entry.createdAtMs)}`;

  const linkedSchedule =
    entry.kind === "workout" && entry.scheduleItemId
      ? getScheduleItemById(entry.scheduleItemId)
      : undefined;

  const onRepeat = (): void => {
    const ok = prepareRepeatFromWorkout(entry.id);
    if (!ok) {
      setToast("Повтор недоступен: нет структуры упражнений или это заметка.");
      return;
    }
    router.push("/workout");
  };

  const canSaveAsTemplate = entry.kind === "workout" && entry.exercises.length > 0;
  const clientTemplatesHref =
    entry.kind === "workout"
      ? `/clients/${encodeURIComponent(entry.clientId)}/templates`
      : `/clients/${encodeURIComponent(entry.clientId)}`;

  const openSaveTemplateForm = (): void => {
    if (entry.kind !== "workout") return;
    setSaveTemplateErrors([]);
    setSaveTemplateName(entry.title.trim() || "Шаблон тренировки");
    setSaveTemplateUi("form");
  };

  const closeSaveTemplate = (): void => {
    setSaveTemplateUi("idle");
    setSaveTemplateErrors([]);
  };

  const submitSaveTemplate = async (): Promise<void> => {
    if (entry.kind !== "workout") return;
    setSaveTemplateErrors([]);
    const res = await Promise.resolve(saveWorkoutAsTemplate({ workoutId: entry.id, name: saveTemplateName }));
    if (!res.ok) {
      setSaveTemplateErrors(res.errors);
      return;
    }
    setSaveTemplateUi("success");
  };

  const startEditing = (): void => {
    setEditErrors([]);
    setEditing(true);
  };

  const cancelEditing = (): void => {
    setEditErrors([]);
    setEditing(false);
  };

  const exerciseCount = entry.kind === "workout" ? countJournalWorkoutExercises(entry.exercises) : 0;
  const volumeLabel =
    entry.kind === "workout"
      ? entry.volumeKg === null
        ? WORKOUT_VOLUME_NOT_CALCULATED_RU
        : `${entry.volumeKg.toLocaleString("ru-RU")} кг`
      : "—";

  return (
    <main className="relative flex w-full flex-col gap-4 px-4 py-6 pb-[calc(6rem+max(0.35rem,env(safe-area-inset-bottom,0px)))]">
      {toast ? (
        <div
          role="status"
          className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] left-1/2 z-50 w-[min(calc(100%-2rem),440px)] -translate-x-1/2 rounded-xl border border-[color:var(--border-strong)] bg-[var(--bg-sheet)] px-4 py-2.5 text-center text-sm font-medium text-[var(--text-primary)] shadow-lg"
        >
          {toast}
        </div>
      ) : null}

      <header>
        <Link href="/journal" prefetch={false} className="text-sm font-medium text-[var(--tg-muted)]">
          ← Журнал
        </Link>
        <p className="mt-2 text-xs text-[var(--tg-muted)]">{headerWhen}</p>
        <h1 className="font-display mt-1 text-2xl font-bold tracking-tight">{entry.title}</h1>
        <Link
          href={`/clients/${encodeURIComponent(entry.clientId)}`}
          prefetch={false}
          className="mt-1 inline-block text-sm font-medium text-[var(--brand-solid)]"
        >
          {entry.clientName}
        </Link>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="rounded-full bg-[var(--tg-bg)] px-3 py-1 text-xs font-medium text-[var(--tg-muted)]">
            {entry.kind === "note" ? "Заметка" : "Тренировка"}
          </span>
          <span className="rounded-full bg-[var(--tg-bg)] px-3 py-1 text-xs text-[var(--tg-muted)]">
            {entry.durationMin} мин
          </span>
        </div>
      </header>

      {editing ? (
        entry.kind === "workout" ? (
          <JournalWorkoutEditPanel
            initial={{
              title: entry.title,
              durationMin: entry.durationMin,
              workoutComment: entry.workoutComment,
              exercises: entry.exercises,
            }}
            errors={editErrors}
            saving={editSaving}
            onCancel={cancelEditing}
            onSave={(draft) => {
              setEditSaving(true);
              setEditErrors([]);
              const res = updateJournalWorkout(entry.id, draft);
              void Promise.resolve(res).then((r) => {
                setEditSaving(false);
                if (!r.ok) {
                  setEditErrors(r.errors);
                  return;
                }
                setEditing(false);
                setToast("Изменения сохранены");
              });
            }}
          />
        ) : (
          <JournalNoteEditPanel
            initial={{
              title: entry.title,
              durationMin: entry.durationMin,
              workoutComment: entry.workoutComment,
            }}
            errors={editErrors}
            saving={editSaving}
            onCancel={cancelEditing}
            onSave={(draft) => {
              setEditSaving(true);
              setEditErrors([]);
              const res = updateJournalNote(entry.id, draft);
              void Promise.resolve(res).then((r) => {
                setEditSaving(false);
                if (!r.ok) {
                  setEditErrors(r.errors);
                  return;
                }
                setEditing(false);
                setToast("Изменения сохранены");
              });
            }}
          />
        )
      ) : (
        <>
          {entry.kind === "workout" ? (
            <Card className="p-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatCell label="Длительность" value={`${entry.durationMin} мин`} />
                <StatCell label="Упражнений" value={String(exerciseCount)} />
                <StatCell label="Подходов" value={String(entry.filledSetCount)} />
                <StatCell label="Объём" value={volumeLabel} />
              </div>
              {entry.summaryHint ? (
                <p className="mt-3 border-t border-[color:var(--border-soft)] pt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {entry.summaryHint}
                </p>
              ) : null}
            </Card>
          ) : null}

          {entry.kind === "workout" && entry.scheduleItemId ? (
            <Card>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--tg-muted)]">График</p>
              {linkedSchedule ? (
                <>
                  <p className="mt-2 text-sm text-[var(--tg-text)]">
                    <span className="font-medium">
                      {formatOverviewHumanDate(linkedSchedule.date, todayIso)} · {linkedSchedule.time}
                    </span>
                    {" · "}
                    {linkedSchedule.title}
                  </p>
                  <p className="mt-2 text-sm text-[var(--tg-muted)]">
                    Статус:{" "}
                    <span className="font-medium text-[var(--tg-text)]">{scheduleStatusLabel[linkedSchedule.status]}</span>
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-[var(--tg-muted)]">Связанный слот в графике недоступен.</p>
              )}
            </Card>
          ) : null}

          {entry.workoutComment.trim().length > 0 ? (
            <Card>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--tg-muted)]">
                {entry.kind === "note" ? "Заметка" : "Комментарий"}
              </p>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-[var(--tg-text)]">
                {entry.workoutComment}
              </p>
            </Card>
          ) : null}

          {entry.kind === "workout" ? (
            entry.exercises.length === 0 ? (
              <Card>
                <p className="text-sm text-[var(--tg-muted)]">Упражнения не записаны.</p>
              </Card>
            ) : (
              <section className="flex flex-col gap-3" aria-label="Упражнения">
                {entry.exercises.map((ex, index) => {
                  const summary = formatExerciseSetsReference(ex);
                  const filled = countFilledSetsInExercise(ex);
                  return (
                    <Card key={ex.id}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[var(--tg-muted)]">Упражнение {index + 1}</p>
                          <h2 className="font-display mt-0.5 text-lg font-semibold">{ex.name || "Без названия"}</h2>
                        </div>
                        {ex.skipped ? (
                          <span className="shrink-0 rounded-full bg-[var(--tg-bg)] px-2 py-0.5 text-xs text-[var(--tg-muted)]">
                            Пропущено
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-full bg-[var(--tg-bg)] px-2 py-0.5 text-xs tabular-nums text-[var(--tg-muted)]">
                            {filled} подх.
                          </span>
                        )}
                      </div>
                      {ex.comment.trim().length > 0 ? (
                        <p className="mt-2 text-sm text-[var(--tg-muted)] whitespace-pre-wrap">{ex.comment}</p>
                      ) : null}
                      {!ex.skipped && summary.length > 0 ? (
                        <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">{summary}</p>
                      ) : null}
                      {!ex.skipped && ex.sets.length > 0 ? (
                        <ul className="mt-3 flex flex-col gap-1.5">
                          {ex.sets.map((row) => {
                            const label = formatSetReferenceLabel(row);
                            return (
                              <li
                                key={row.id}
                                className={`rounded-lg bg-[var(--tg-bg)] px-3 py-2 text-sm ${row.isDrop ? "border-l-2 border-[color:var(--border-strong)]" : ""} ${row.done ? "ring-1 ring-[color:color-mix(in_srgb,var(--success),transparent_70%)]" : ""}`}
                              >
                                <span className="text-[var(--tg-muted)]">
                                  {row.isDrop ? "Дроп" : "Подход"} ·{" "}
                                </span>
                                <span className="text-[var(--text-primary)]">{label ?? "—"}</span>
                                {row.comment.trim().length > 0 ? (
                                  <span className="mt-0.5 block text-xs text-[var(--tg-muted)]">{row.comment}</span>
                                ) : null}
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                    </Card>
                  );
                })}
              </section>
            )
          ) : (
            <Card>
              <p className="text-sm text-[var(--tg-muted)]">Заметка без подходов и объёма.</p>
            </Card>
          )}

          <section className="flex flex-col gap-2">
            <button
              type="button"
              className="app-btn rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-4 py-3 text-[var(--text-primary)]"
              onClick={startEditing}
            >
              Редактировать запись
            </button>

            {entry.kind === "workout" && entry.exercises.length > 0 ? (
              <button
                type="button"
                className="app-btn rounded-2xl bg-[var(--tg-accent)] px-4 py-3 text-white shadow-app-primary"
                onClick={onRepeat}
              >
                Повторить тренировку
              </button>
            ) : null}

            {canSaveAsTemplate && saveTemplateUi === "idle" ? (
              <button
                type="button"
                className="app-btn rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-4 py-3 text-[var(--text-primary)]"
                onClick={openSaveTemplateForm}
              >
                Сохранить как шаблон
              </button>
            ) : null}

            {canSaveAsTemplate && saveTemplateUi === "form" ? (
              <Card className="p-4">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Название шаблона</p>
                <input
                  value={saveTemplateName}
                  onChange={(ev) => setSaveTemplateName(ev.target.value)}
                  className="mt-2 min-h-[44px] w-full rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3 py-2 text-[15px] text-[var(--text-primary)] outline-none focus:border-[color:color-mix(in_srgb,var(--brand-solid),transparent_35%)]"
                  placeholder="Например, Ноги"
                  autoComplete="off"
                />
                {saveTemplateErrors.length > 0 ? (
                  <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-[var(--warning)]">
                    {saveTemplateErrors.map((err) => (
                      <li key={err}>{err}</li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-3 flex flex-col gap-2">
                  <button
                    type="button"
                    className="app-btn rounded-2xl bg-[var(--tg-accent)] px-4 py-3 text-white shadow-app-primary"
                    onClick={() => void submitSaveTemplate()}
                  >
                    Сохранить шаблон
                  </button>
                  <button
                    type="button"
                    className="app-btn rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-4 py-3 text-[var(--text-primary)]"
                    onClick={closeSaveTemplate}
                  >
                    Отмена
                  </button>
                </div>
              </Card>
            ) : null}

            {canSaveAsTemplate && saveTemplateUi === "success" ? (
              <Card className="border border-[color:color-mix(in_srgb,var(--tg-accent),transparent_55%)] bg-[color:color-mix(in_srgb,var(--tg-accent),transparent_94%)] p-4">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Шаблон сохранён</p>
                <Link
                  href={clientTemplatesHref}
                  prefetch={false}
                  className="app-btn mt-3 block rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-4 py-3 text-center text-sm font-medium text-[var(--text-primary)]"
                >
                  Шаблоны клиента
                </Link>
                <button
                  type="button"
                  className="app-btn mt-2 w-full rounded-2xl px-4 py-2 text-sm font-semibold text-[var(--tg-muted)]"
                  onClick={closeSaveTemplate}
                >
                  Понятно
                </button>
              </Card>
            ) : null}
          </section>
        </>
      )}
    </main>
  );
}
