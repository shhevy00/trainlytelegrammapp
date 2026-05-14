"use client";

import Link from "next/link";
import { useMemo, useState, type ReactElement, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { useMockApp } from "@/lib/mock/MockAppProvider";
import type { WorkoutTemplate } from "@/lib/workout/templates";

const btnPrimary =
  "app-btn min-h-[44px] w-full rounded-2xl bg-[var(--tg-accent)] px-4 py-3 text-center text-[15px] font-semibold text-white shadow-app-primary";
const btnSecondary =
  "app-btn rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-4 py-2.5 text-center text-sm font-medium text-[var(--text-primary)]";
const btnDanger =
  "app-btn rounded-xl border border-[color:color-mix(in_srgb,var(--warning),transparent_40%)] bg-[color:color-mix(in_srgb,var(--warning),transparent_92%)] px-3 py-2 text-xs font-semibold text-[var(--warning)]";

function plannedSetsSummary(t: WorkoutTemplate): string | null {
  const nums = t.exercises.map((e) => e.plannedSets).filter((n): n is number => typeof n === "number" && Number.isInteger(n));
  if (nums.length === 0) return null;
  const sum = nums.reduce((a, b) => a + b, 0);
  return `План подходов: ${sum} всего`;
}

function ModalScrim({ children }: { children: ReactNode }): ReactElement {
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/55 p-4 pb-[calc(6.5rem+max(0.35rem,env(safe-area-inset-bottom,0px)))] sm:items-center sm:pb-4">
      {children}
    </div>
  );
}

interface ClientTemplatesPageContentProps {
  clientId: string;
}

export function ClientTemplatesPageContent({ clientId }: ClientTemplatesPageContentProps): ReactElement {
  const { clients, getTemplatesForClient, archiveWorkoutTemplate } = useMockApp();
  const [archiveTarget, setArchiveTarget] = useState<WorkoutTemplate | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  const client = useMemo(() => clients.find((c) => c.id === clientId), [clients, clientId]);
  const templates = useMemo(() => getTemplatesForClient(clientId), [getTemplatesForClient, clientId]);
  const basePath = `/clients/${encodeURIComponent(clientId)}/templates`;

  const confirmArchive = async (): Promise<void> => {
    if (!archiveTarget) return;
    setArchiveError(null);
    const res = await Promise.resolve(archiveWorkoutTemplate(archiveTarget.id));
    if (!res.ok) {
      setArchiveError(res.error);
      return;
    }
    setArchiveTarget(null);
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
          <h1 className="font-display text-lg font-semibold text-[var(--text-primary)]">Клиент не найден</h1>
          <p className="mt-2 text-sm text-[var(--tg-muted)]">Нет клиента с таким идентификатором.</p>
          <Link href="/clients" className="mt-4 inline-block text-sm font-semibold text-[var(--tg-accent)]" prefetch={false}>
            К списку клиентов
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex w-full flex-col gap-4 px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
      <header className="flex flex-col gap-1">
        <Link
          href={`/clients/${encodeURIComponent(clientId)}`}
          className="text-sm text-[var(--tg-accent)]"
          prefetch={false}
        >
          ← {client.name}
        </Link>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">Шаблоны тренировки</h1>
        <p className="text-sm text-[var(--tg-muted)]">{client.name}</p>
      </header>

      <Link href={`${basePath}/new`} prefetch={false} className={btnPrimary}>
        Создать шаблон
      </Link>

      {templates.length === 0 ? (
        <Card className="border-dashed border-[color:var(--border-strong)] p-5">
          <p className="text-base font-medium text-[var(--text-primary)]">Шаблонов пока нет</p>
          <p className="mt-2 text-sm text-[var(--tg-muted)]">
            Создайте структуру тренировки, чтобы быстрее начинать занятия.
          </p>
          <Link href={`${basePath}/new`} prefetch={false} className={`mt-4 block ${btnPrimary}`}>
            Создать шаблон
          </Link>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {templates.map((t) => {
            const planLine = plannedSetsSummary(t);
            return (
              <li key={t.id}>
                <Card className="p-4">
                  <div className="flex flex-col gap-2">
                    <p className="text-lg font-semibold leading-snug text-[var(--text-primary)]">{t.name}</p>
                    <p className="text-sm text-[var(--tg-muted)]">
                      Упражнений: <span className="font-medium text-[var(--tg-text)]">{t.exercises.length}</span>
                    </p>
                    {t.description ? (
                      <p className="text-sm text-[var(--tg-muted)] line-clamp-2">{t.description}</p>
                    ) : null}
                    {planLine ? <p className="text-xs text-[var(--tg-muted)]">{planLine}</p> : null}
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Link
                        href={`${basePath}/${encodeURIComponent(t.id)}`}
                        prefetch={false}
                        className={`flex-1 text-center ${btnSecondary}`}
                      >
                        Редактировать
                      </Link>
                      <button type="button" className={`flex-1 sm:flex-initial ${btnDanger}`} onClick={() => setArchiveTarget(t)}>
                        Архивировать
                      </button>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {archiveTarget ? (
        <ModalScrim>
          <div
            role="dialog"
            aria-modal="true"
            className="w-[calc(100%-2rem)] max-w-md rounded-3xl border border-[color:var(--border-soft)] bg-[var(--tg-card)] p-5 text-[var(--tg-text)] shadow-2xl"
          >
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Архивировать шаблон?</h2>
            <p className="mt-2 text-sm text-[var(--tg-muted)]">
              «{archiveTarget.name}» исчезнет из списка, но старые тренировки не изменятся.
            </p>
            {archiveError ? <p className="mt-2 text-sm font-medium text-[var(--warning)]">{archiveError}</p> : null}
            <div className="mt-4 flex flex-col gap-2">
              <button type="button" className={btnPrimary} onClick={() => void confirmArchive()}>
                Архивировать
              </button>
              <button type="button" className={btnSecondary} onClick={() => { setArchiveTarget(null); setArchiveError(null); }}>
                Отмена
              </button>
            </div>
          </div>
        </ModalScrim>
      ) : null}
    </main>
  );
}
