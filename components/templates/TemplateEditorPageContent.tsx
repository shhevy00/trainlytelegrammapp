"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, type FormEvent, type ReactElement, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { newWorkoutId } from "@/lib/workout/ids";
import { useMockApp } from "@/lib/mock/MockAppProvider";
import {
  validateTemplateInput,
  type CreateWorkoutTemplateInput,
  type WorkoutTemplate,
} from "@/lib/workout/templates";

const btnPrimary =
  "app-btn min-h-[44px] w-full rounded-2xl bg-[var(--tg-accent)] px-4 py-3 text-center text-[15px] font-semibold text-white shadow-app-primary";
const btnSecondary =
  "app-btn rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-4 py-2.5 text-center text-sm font-medium text-[var(--text-primary)]";
const btnDanger =
  "app-btn w-full rounded-2xl border border-[color:color-mix(in_srgb,var(--warning),transparent_40%)] bg-[color:color-mix(in_srgb,var(--warning),transparent_92%)] px-4 py-3 text-sm font-semibold text-[var(--warning)]";
const inputClass =
  "min-h-[44px] w-full rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3 py-2 text-[15px] text-[var(--text-primary)] outline-none focus:border-[color:color-mix(in_srgb,var(--brand-solid),transparent_35%)]";
const textareaClass =
  "w-full resize-none rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[color:color-mix(in_srgb,var(--brand-solid),transparent_35%)]";

type ExerciseDraftRow = {
  key: string;
  /** Существующий id упражнения в шаблоне (для update). */
  templateExerciseId?: string;
  name: string;
  plannedSetsStr: string;
  comment: string;
};

function ModalScrim({ children }: { children: ReactNode }): ReactElement {
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/55 p-4 pb-[calc(6.5rem+max(0.35rem,env(safe-area-inset-bottom,0px)))] sm:items-center sm:pb-4">
      {children}
    </div>
  );
}

function emptyExerciseRow(): ExerciseDraftRow {
  return { key: newWorkoutId(), name: "", plannedSetsStr: "", comment: "" };
}

function templateToRows(t: WorkoutTemplate): ExerciseDraftRow[] {
  const sorted = [...t.exercises].sort((a, b) => a.orderIndex - b.orderIndex);
  return sorted.map((ex) => ({
    key: ex.id,
    templateExerciseId: ex.id,
    name: ex.name,
    plannedSetsStr: ex.plannedSets != null ? String(ex.plannedSets) : "",
    comment: ex.comment ?? "",
  }));
}

function parsePlannedSetsField(raw: string): number | undefined {
  const t = raw.trim();
  if (t.length === 0) return undefined;
  const n = Number(t);
  if (Number.isInteger(n) && n >= 1 && n <= 20) return n;
  return undefined;
}

function validatePlannedSetsStrings(rows: ExerciseDraftRow[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const t = rows[i].plannedSetsStr.trim();
    if (t.length === 0) continue;
    const n = Number(t);
    if (!Number.isInteger(n) || n < 1 || n > 20) {
      out.push(`Упражнение ${i + 1}: в поле «План подходов» укажите целое число от 1 до 20 или оставьте пустым.`);
    }
  }
  return out;
}

function rowsToCreateInput(
  clientId: string,
  name: string,
  description: string,
  rows: ExerciseDraftRow[],
): CreateWorkoutTemplateInput {
  return {
    clientId,
    name,
    description: description.trim() || undefined,
    exercises: rows.map((r) => ({
      name: r.name,
      plannedSets: parsePlannedSetsField(r.plannedSetsStr),
      comment: r.comment.trim() || undefined,
    })),
  };
}

interface TemplateEditorPageContentProps {
  clientId: string;
  /** undefined — режим создания */
  templateId?: string;
}

export function TemplateEditorPageContent({ clientId, templateId }: TemplateEditorPageContentProps): ReactElement {
  const router = useRouter();
  const isEdit = templateId !== undefined && templateId.length > 0;
  const { clients, getTemplateById, createWorkoutTemplate, updateWorkoutTemplate, archiveWorkoutTemplate } =
    useMockApp();

  const client = useMemo(() => clients.find((c) => c.id === clientId), [clients, clientId]);
  const existing = useMemo(
    () => (isEdit && templateId ? getTemplateById(templateId) : undefined),
    [isEdit, templateId, getTemplateById],
  );

  const [name, setName] = useState(() =>
    isEdit && existing && !existing.archivedAtIso ? existing.name : "",
  );
  const [description, setDescription] = useState(() =>
    isEdit && existing && !existing.archivedAtIso ? existing.description ?? "" : "",
  );
  const [rows, setRows] = useState<ExerciseDraftRow[]>(() => {
    if (isEdit && existing && !existing.archivedAtIso) {
      const r = templateToRows(existing);
      return r.length > 0 ? r : [emptyExerciseRow()];
    }
    return [emptyExerciseRow()];
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  const listHref = `/clients/${encodeURIComponent(clientId)}/templates`;
  const profileHref = `/clients/${encodeURIComponent(clientId)}`;

  const cancel = useCallback((): void => {
    router.push(listHref);
  }, [router, listHref]);

  const addRow = useCallback((): void => {
    setRows((r) => [...r, emptyExerciseRow()]);
  }, []);

  const move = useCallback((index: number, dir: -1 | 1): void => {
    setRows((prev) => {
      const j = index + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  }, []);

  const requestDeleteRow = useCallback((index: number): void => {
    setRows((prev) => {
      const row = prev[index];
      if (!row) return prev;
      const hasData =
        row.name.trim().length > 0 || row.comment.trim().length > 0 || row.plannedSetsStr.trim().length > 0;
      if (hasData && typeof window !== "undefined" && !window.confirm("Удалить это упражнение из шаблона?")) {
        return prev;
      }
      const next = prev.filter((_, i) => i !== index);
      return next.length === 0 ? [emptyExerciseRow()] : next;
    });
  }, []);

  const patchRow = useCallback((index: number, patch: Partial<ExerciseDraftRow>): void => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }, []);

  const onSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setErrors([]);
    setSaveError(null);
    if (!client) return;

    const plannedErrors = validatePlannedSetsStrings(rows);
    if (plannedErrors.length > 0) {
      setErrors(plannedErrors);
      return;
    }

    const input = rowsToCreateInput(clientId, name, description, rows);
    const validationErrors = validateTemplateInput(input);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!isEdit) {
      const res = await Promise.resolve(createWorkoutTemplate(input));
      if (!res.ok) {
        setErrors(res.errors);
        return;
      }
      router.push(listHref);
      return;
    }

    if (!templateId || !existing) {
      setSaveError("Шаблон не найден.");
      return;
    }

    const res = await Promise.resolve(
      updateWorkoutTemplate(templateId, {
        name: input.name,
        description: input.description,
        exercises: rows.map((r) => ({
          id: r.templateExerciseId,
          name: r.name,
          plannedSets: parsePlannedSetsField(r.plannedSetsStr),
          comment: r.comment.trim() || undefined,
        })),
      }),
    );
    if (!res.ok) {
      setErrors(res.errors);
      return;
    }
    router.push(listHref);
  };

  const confirmArchive = async (): Promise<void> => {
    if (!templateId) return;
    setArchiveError(null);
    const res = await Promise.resolve(archiveWorkoutTemplate(templateId));
    if (!res.ok) {
      setArchiveError(res.error);
      return;
    }
    setArchiveOpen(false);
    router.push(listHref);
  };

  if (!client) {
    return (
      <main className="flex w-full flex-col gap-4 px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
        <header>
          <Link href="/clients" className="text-sm text-[var(--tg-accent)]" prefetch={false}>
            ← Клиенты
          </Link>
        </header>
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

  if (isEdit && templateId) {
    if (!existing || existing.clientId !== clientId) {
      return (
        <main className="flex w-full flex-col gap-4 px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
          <header>
            <Link href={listHref} className="text-sm text-[var(--tg-accent)]" prefetch={false}>
              ← Шаблоны
            </Link>
          </header>
          <Card>
            <h1 className="font-display text-lg font-semibold">Шаблон не найден</h1>
            <p className="mt-2 text-sm text-[var(--tg-muted)]">Нет шаблона с таким адресом или он принадлежит другому клиенту.</p>
            <Link href={listHref} className="mt-4 inline-block text-sm font-semibold text-[var(--tg-accent)]" prefetch={false}>
              К списку шаблонов
            </Link>
          </Card>
        </main>
      );
    }
    if (existing.archivedAtIso) {
      return (
        <main className="flex w-full flex-col gap-4 px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
          <header>
            <Link href={listHref} className="text-sm text-[var(--tg-accent)]" prefetch={false}>
              ← Шаблоны
            </Link>
          </header>
          <Card>
            <h1 className="font-display text-lg font-semibold">Шаблон в архиве</h1>
            <p className="mt-2 text-sm text-[var(--tg-muted)]">
              Редактирование недоступно. Можно создать новый шаблон или вернуться к списку.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href={`/clients/${encodeURIComponent(clientId)}/templates/new`}
                className={`${btnPrimary} block text-center`}
                prefetch={false}
              >
                Новый шаблон
              </Link>
              <Link href={listHref} className="text-center text-sm font-semibold text-[var(--tg-accent)]" prefetch={false}>
                К списку шаблонов
              </Link>
            </div>
          </Card>
        </main>
      );
    }
  }

  return (
    <main className="flex w-full flex-col gap-4 px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
      <header className="flex flex-col gap-1">
        <Link href={listHref} className="text-sm text-[var(--tg-accent)]" prefetch={false}>
          ← Шаблоны тренировки
        </Link>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          {isEdit ? "Редактирование шаблона" : "Новый шаблон тренировки"}
        </h1>
        <p className="text-sm text-[var(--tg-muted)]">{client.name}</p>
      </header>

      <form className="flex flex-col gap-4" onSubmit={(e) => void onSubmit(e)}>
        <Card className="p-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[var(--text-primary)]">Название шаблона тренировки</span>
            <input
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              className={inputClass}
              placeholder="Например, Ноги"
              autoComplete="off"
            />
          </label>
          <label className="mt-4 flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[var(--text-primary)]">Описание (необязательно)</span>
            <textarea
              value={description}
              onChange={(ev) => setDescription(ev.target.value)}
              rows={2}
              className={textareaClass}
              placeholder="Кратко, для себя"
            />
          </label>
        </Card>

        <div>
          <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">Упражнения</h2>
          <p className="mt-1 text-xs text-[var(--tg-muted)]">Только структура: название и план подходов (не фактические веса).</p>
        </div>

        <ul className="flex flex-col gap-3">
          {rows.map((row, index) => (
            <li key={row.key}>
              <Card className="p-3">
                <div className="flex items-center justify-between gap-2 border-b border-[color:var(--border-soft)] pb-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--tg-muted)]">
                    Упражнение {index + 1}
                  </span>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      className="app-btn rounded-lg border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-2 py-1 text-xs font-semibold text-[var(--text-primary)] disabled:opacity-35"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      aria-label="Выше"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="app-btn rounded-lg border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-2 py-1 text-xs font-semibold text-[var(--text-primary)] disabled:opacity-35"
                      disabled={index === rows.length - 1}
                      onClick={() => move(index, 1)}
                      aria-label="Ниже"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="app-btn rounded-lg border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-2 py-1 text-xs font-semibold text-[var(--warning)]"
                      onClick={() => requestDeleteRow(index)}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
                <label className="mt-3 flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-[var(--text-primary)]">Название</span>
                  <input
                    value={row.name}
                    onChange={(ev) => patchRow(index, { name: ev.target.value })}
                    className={inputClass}
                    placeholder="Например, Жим ногами"
                  />
                </label>
                <label className="mt-3 flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-[var(--text-primary)]">План подходов (1–20, необязательно)</span>
                  <input
                    inputMode="numeric"
                    value={row.plannedSetsStr}
                    onChange={(ev) => patchRow(index, { plannedSetsStr: ev.target.value })}
                    className={`${inputClass} tabular-nums`}
                    placeholder="Пусто = одна пустая строка в логгере"
                  />
                </label>
                <label className="mt-3 flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-[var(--text-primary)]">Комментарий к упражнению</span>
                  <textarea
                    value={row.comment}
                    onChange={(ev) => patchRow(index, { comment: ev.target.value })}
                    rows={2}
                    className={textareaClass}
                    placeholder="Необязательно"
                  />
                </label>
              </Card>
            </li>
          ))}
        </ul>

        <button type="button" className={btnSecondary} onClick={addRow}>
          Добавить упражнение
        </button>

        {errors.length > 0 ? (
          <Card className="border border-[color:color-mix(in_srgb,var(--warning),transparent_55%)] bg-[color:color-mix(in_srgb,var(--warning),transparent_92%)] p-3">
            <ul className="list-inside list-disc space-y-1 text-sm text-[var(--text-primary)]">
              {errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </Card>
        ) : null}
        {saveError ? <p className="text-sm font-medium text-[var(--warning)]">{saveError}</p> : null}

        <button type="submit" className={btnPrimary}>
          Сохранить шаблон
        </button>
        <button type="button" className={btnSecondary} onClick={cancel}>
          Отмена
        </button>
        <Link href={profileHref} prefetch={false} className="text-center text-sm text-[var(--tg-muted)]">
          К профилю клиента
        </Link>
      </form>

      {isEdit ? (
        <>
          <div className="border-t border-[color:var(--border-soft)] pt-4">
            <button type="button" className={btnDanger} onClick={() => { setArchiveOpen(true); setArchiveError(null); }}>
              Архивировать шаблон
            </button>
          </div>
          {archiveOpen ? (
            <ModalScrim>
              <div
                role="dialog"
                aria-modal="true"
                className="w-[calc(100%-2rem)] max-w-md rounded-3xl border border-[color:var(--border-soft)] bg-[var(--tg-card)] p-5 text-[var(--tg-text)] shadow-2xl"
              >
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Архивировать шаблон?</h2>
                <p className="mt-2 text-sm text-[var(--tg-muted)]">
                  Он исчезнет из списка, но старые тренировки не изменятся.
                </p>
                {archiveError ? <p className="mt-2 text-sm font-medium text-[var(--warning)]">{archiveError}</p> : null}
                <div className="mt-4 flex flex-col gap-2">
                  <button type="button" className={btnPrimary} onClick={() => void confirmArchive()}>
                    Архивировать
                  </button>
                  <button type="button" className={btnSecondary} onClick={() => { setArchiveOpen(false); setArchiveError(null); }}>
                    Отмена
                  </button>
                </div>
              </div>
            </ModalScrim>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
