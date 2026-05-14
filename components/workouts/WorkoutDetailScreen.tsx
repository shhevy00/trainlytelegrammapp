"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactElement } from "react";
import { Card } from "@/components/ui/card";
import type { MockScheduleStatus } from "@/lib/mock/data";
import { formatJournalDayLabel, formatJournalTime } from "@/lib/mock/journalSeed";
import { useMockApp } from "@/lib/mock/MockAppProvider";
import { formatOverviewHumanDate } from "@/lib/overview/dailyOperations";
import type { JournalCompletedWorkout, JournalEntry } from "@/lib/types";
import type { WorkoutSetRow } from "@/lib/workout/types";
import { formatCompletedWorkoutVolumeSentence } from "@/lib/workout/calculations";

function describeSetRow(row: WorkoutSetRow): string {
  if (row.setType === "time") {
    const v = row.durationSec.trim();
    return v.length > 0 ? `${v} сек` : "—";
  }
  const w = row.weight.trim();
  const r = row.reps.trim();
  const wr = w && r ? `${w}×${r}` : w || r || "—";
  const c = row.comment.trim();
  const tail = c.length > 0 ? ` · ${c}` : "";
  const done = row.done ? " ✓" : "";
  return `${wr}${tail}${done}`;
}

function buildFollowUpDraft(entry: JournalCompletedWorkout): string {
  const vol = formatCompletedWorkoutVolumeSentence(entry.volumeKg);
  return `${entry.clientName}, отличная работа на «${entry.title}». ${vol}`;
}

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

export function WorkoutDetailScreen({ workoutId }: WorkoutDetailScreenProps): ReactElement {
  const router = useRouter();
  const { todayIso, getJournalEntry, prepareRepeatFromWorkout, getScheduleItemById, saveWorkoutAsTemplate } =
    useMockApp();
  const [toast, setToast] = useState<string | null>(null);
  const [saveTemplateUi, setSaveTemplateUi] = useState<SaveTemplateUi>("idle");
  const [saveTemplateName, setSaveTemplateName] = useState("");
  const [saveTemplateErrors, setSaveTemplateErrors] = useState<string[]>([]);

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

  const onCopyMessage = async (): Promise<void> => {
    const text =
      entry.kind === "workout"
        ? buildFollowUpDraft(entry)
        : `${entry.clientName}, зафиксирована встреча без подходов: «${entry.title}».`;
    try {
      await navigator.clipboard.writeText(text);
      setToast("Скопировано");
    } catch {
      setToast("Не удалось скопировать — выделите текст вручную.");
    }
  };

  const setTypeRu = (t: string): string => {
    if (t === "time") return "время";
    if (t === "warmup") return "разминка";
    return "вес/повторы";
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

  return (
    <main className="relative flex w-full flex-col gap-4 px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
      {toast ? (
        <div
          role="status"
          className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] left-1/2 z-50 w-[min(calc(100%-2rem),440px)] -translate-x-1/2 rounded-xl border border-[color:var(--border-strong)] bg-[var(--bg-sheet)] px-4 py-2.5 text-center text-sm font-medium text-[var(--text-primary)] shadow-lg"
        >
          {toast}
        </div>
      ) : null}
      <header>
        <p className="text-xs text-[var(--tg-muted)]">{headerWhen}</p>
        <h1 className="font-display mt-1 text-2xl font-bold tracking-tight">{entry.title}</h1>
        <p className="mt-1 text-sm text-[var(--tg-muted)]">{entry.clientName}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="rounded-full bg-[var(--tg-bg)] px-3 py-1 text-xs text-[var(--tg-muted)]">
            {entry.kind === "note" ? "Заметка" : "Завершено"}
          </span>
          <span className="rounded-full bg-[var(--tg-bg)] px-3 py-1 text-xs text-[var(--tg-muted)]">
            {entry.durationMin} мин
          </span>
          {entry.kind === "workout" ? (
            <span className="rounded-full bg-[var(--tg-bg)] px-3 py-1 text-xs text-[var(--tg-muted)]">
              Подходов с отметкой: {entry.filledSetCount}
            </span>
          ) : null}
        </div>
      </header>

      {entry.kind === "workout" && entry.scheduleItemId ? (
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--tg-muted)]">Связь с графиком</p>
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
            <p className="mt-2 text-sm text-[var(--tg-muted)]">Связанная запись в графике сейчас недоступна.</p>
          )}
        </Card>
      ) : null}

      {entry.kind === "workout" ? (
        <>
          <Card>
            <p className="text-sm text-[var(--tg-muted)]">Объём</p>
            <p className="mt-2 text-lg font-semibold">
              {entry.volumeKg === null ? "Объём не рассчитан" : `${entry.volumeKg.toLocaleString("ru-RU")} кг`}
            </p>
            {entry.summaryHint ? (
              <p className="mt-3 text-sm leading-relaxed text-[var(--tg-text)]">{entry.summaryHint}</p>
            ) : null}
          </Card>

          {entry.workoutComment.trim().length > 0 ? (
            <Card>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--tg-muted)]">
                Комментарий к тренировке
              </p>
              <p className="mt-2 text-sm whitespace-pre-wrap">{entry.workoutComment}</p>
            </Card>
          ) : null}

          {entry.exercises.length === 0 ? (
            <Card>
              <p className="text-sm leading-relaxed text-[var(--tg-muted)]">
                Это первое выполнение.
                <br />
                История появится после тренировки.
              </p>
            </Card>
          ) : (
            <section className="flex flex-col gap-3">
              {entry.exercises.map((ex) => (
                <Card key={ex.id}>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-display text-lg font-semibold">{ex.name}</h2>
                    {ex.skipped ? <span className="text-xs text-[var(--tg-muted)]">Пропущено</span> : null}
                  </div>
                  {ex.comment.trim().length > 0 ? (
                    <p className="mt-2 text-sm text-[var(--tg-muted)] whitespace-pre-wrap">{ex.comment}</p>
                  ) : null}
                  {!ex.skipped ? (
                    <ul className="mt-3 flex flex-col gap-2">
                      {ex.sets.map((row) => (
                        <li
                          key={row.id}
                          className={`rounded-xl bg-[var(--tg-bg)] px-3 py-2 text-sm ${row.isDrop ? "border-l border-[color:var(--border-strong)] pl-4" : ""}`}
                        >
                          <span className="text-[var(--tg-muted)]">{setTypeRu(row.setType)} · </span>
                          {describeSetRow(row)}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </Card>
              ))}
            </section>
          )}
        </>
      ) : (
        <Card>
          <p className="text-base font-medium">Сохранено как заметка</p>
          <p className="mt-2 text-sm text-[var(--tg-muted)]">Сохранено без подходов.</p>
          {entry.workoutComment.trim().length > 0 ? (
            <p className="mt-4 text-sm whitespace-pre-wrap">{entry.workoutComment}</p>
          ) : null}
        </Card>
      )}

      <section className="flex flex-col gap-2">
        {entry.kind === "workout" && entry.exercises.length > 0 ? (
          <button
            type="button"
            className="app-btn rounded-2xl bg-[var(--tg-accent)] px-4 py-3 text-white shadow-app-primary"
            onClick={onRepeat}
          >
            Повторить тренировку
          </button>
        ) : entry.kind === "workout" ? (
          <p className="text-sm leading-relaxed text-[var(--tg-muted)]">
            Повтор недоступен: в записи нет структуры упражнений.
          </p>
        ) : null}

        {canSaveAsTemplate && saveTemplateUi === "idle" ? (
          <button
            type="button"
            className="app-btn rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-4 py-3 text-[var(--text-primary)]"
            onClick={openSaveTemplateForm}
          >
            Сохранить как шаблон тренировки
          </button>
        ) : null}

        {canSaveAsTemplate && saveTemplateUi === "form" ? (
          <Card className="p-4">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Название шаблона тренировки</p>
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
            <p className="mt-1 text-xs text-[var(--tg-muted)]">Его можно выбрать при следующем старте тренировки.</p>
            <Link
              href={clientTemplatesHref}
              prefetch={false}
              className="app-btn mt-3 block rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-4 py-3 text-center text-sm font-medium text-[var(--text-primary)]"
            >
              Открыть шаблоны клиента
            </Link>
            <button
              type="button"
              className="app-btn mt-2 w-full rounded-2xl border border-transparent px-4 py-2 text-sm font-semibold text-[var(--tg-muted)]"
              onClick={closeSaveTemplate}
            >
              Понятно
            </button>
          </Card>
        ) : null}

        <Link
          href={`/clients/${encodeURIComponent(entry.clientId)}`}
          className="app-btn rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-4 py-3 text-center text-[var(--text-primary)]"
          prefetch={false}
        >
          Открыть клиента
        </Link>

        <Link
          href="/journal"
          className="app-btn rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-4 py-3 text-center text-[var(--text-primary)]"
          prefetch={false}
        >
          В журнал
        </Link>

        <button
          type="button"
          className="app-btn rounded-2xl border border-transparent px-4 py-2.5 text-sm font-semibold text-[var(--tg-muted)]"
          onClick={() => void onCopyMessage()}
        >
          Копировать текст
        </button>

        <p className="text-center text-[11px] leading-relaxed text-[var(--tg-muted)]">
          Редактирование записи в журнале — <span className="font-medium text-[var(--text-secondary)]">скоро</span>
        </p>
      </section>
    </main>
  );
}
