"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent, type ReactElement } from "react";
import { Card } from "@/components/ui/card";
import type { CoachQuickNoteType } from "@/lib/mock/coachLedger";
import { useMockApp } from "@/lib/mock/MockAppProvider";

const NOTE_OPTIONS: { value: CoachQuickNoteType; label: string }[] = [
  { value: "general", label: "Общее" },
  { value: "limitation", label: "Ограничение" },
  { value: "payment", label: "Оплата" },
  { value: "progress", label: "Прогресс" },
  { value: "complaint", label: "Жалоба" },
];

const NOTE_EFFECT: Record<CoachQuickNoteType, string> = {
  general: "Сохранится в карточке клиента.",
  limitation: "Сохранится как ограничение в карточке клиента.",
  payment: "Появится в оплатах и напоминаниях.",
  progress: "Попадёт в заметки прогресса.",
  complaint: "Попадёт в список «Внимание» у клиента.",
};

const btnPrimary =
  "app-btn rounded-2xl bg-[var(--tg-accent)] px-4 py-3 text-center text-white shadow-app-primary disabled:opacity-40";
const btnGhost =
  "app-btn rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-4 py-3 text-center text-[var(--text-primary)]";

interface QuickNoteFlowInnerProps {
  initialClientId: string | null;
}

function QuickNoteFlowInner({ initialClientId }: QuickNoteFlowInnerProps): ReactElement {
  const router = useRouter();
  const { clients, addCoachQuickNote } = useMockApp();

  const [clientId, setClientId] = useState<string>(() => initialClientId ?? "");
  const [type, setType] = useState<CoachQuickNoteType>("general");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savedForClientId, setSavedForClientId] = useState<string | null>(null);

  const selectedClient = useMemo(() => clients.find((c) => c.id === clientId), [clients, clientId]);

  const onSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    if (!clientId) {
      setError("Выберите клиента — заметка привязывается к профилю.");
      return;
    }
    const client = clients.find((c) => c.id === clientId);
    if (!client) {
      setError("Клиент не найден.");
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Введите текст заметки.");
      return;
    }
    await Promise.resolve(
      addCoachQuickNote({
        clientId: client.id,
        clientName: client.name,
        type,
        text: trimmed,
      }),
    );
    setSavedForClientId(client.id);
    setText("");
  };

  if (savedForClientId) {
    return (
      <main className="flex w-full flex-col gap-4 px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
        <header>
          <h1 className="font-display text-2xl font-bold tracking-tight">Быстрая заметка</h1>
        </header>
        <Card className="flex flex-col gap-3">
          <p className="text-base font-semibold text-[var(--text-primary)]">Заметка сохранена</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href={`/clients/${encodeURIComponent(savedForClientId)}`}
              prefetch={false}
              className={`flex-1 ${btnPrimary} text-center`}
            >
              Открыть клиента
            </Link>
            <Link
              href={`/quick-note?clientId=${encodeURIComponent(savedForClientId)}`}
              prefetch={false}
              className={`flex-1 ${btnGhost}`}
            >
              Добавить ещё
            </Link>
          </div>
          <button type="button" className={`${btnGhost} w-full`} onClick={() => router.push("/overview")}>
            На обзор
          </button>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex w-full flex-col gap-4 px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
      <header className="flex flex-col gap-2">
        <Link href="/overview" className="text-sm text-[var(--tg-accent)]" prefetch={false}>
          ← Обзор
        </Link>
        <h1 className="font-display text-2xl font-bold tracking-tight">Быстрая заметка</h1>
        <p className="text-sm text-[var(--tg-muted)]">
          Тип заметки влияет на оплаты, прогресс и фильтр «Внимание».
        </p>
      </header>

      <Card>
        <form className="flex flex-col gap-4" onSubmit={(e) => void onSubmit(e)}>
          <div>
            <label htmlFor="qn-client" className="text-sm font-medium text-[var(--tg-text)]">
              Клиент
            </label>
            <select
              id="qn-client"
              className="mt-2 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3 py-3 text-sm text-[var(--tg-text)] outline-none focus:border-[color:color-mix(in_srgb,var(--brand-solid),transparent_35%)]"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <option value="">Выберите клиента</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="qn-type" className="text-sm font-medium text-[var(--tg-text)]">
              Тип
            </label>
            <select
              id="qn-type"
              className="mt-2 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3 py-3 text-sm text-[var(--tg-text)] outline-none focus:border-[color:color-mix(in_srgb,var(--brand-solid),transparent_35%)]"
              value={type}
              onChange={(e) => setType(e.target.value as CoachQuickNoteType)}
            >
              {NOTE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs leading-relaxed text-[var(--tg-muted)]">{NOTE_EFFECT[type]}</p>
          </div>

          <div>
            <label htmlFor="qn-text" className="text-sm font-medium text-[var(--tg-text)]">
              Текст
            </label>
            <textarea
              id="qn-text"
              rows={5}
              className="mt-2 w-full resize-none rounded-2xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3 py-3 text-sm text-[var(--tg-text)] outline-none focus:border-[color:color-mix(in_srgb,var(--brand-solid),transparent_35%)]"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          {error ? <p className="text-sm text-[var(--warning)]">{error}</p> : null}

          <button type="submit" className={btnPrimary}>
            Сохранить
          </button>
        </form>
      </Card>

      {selectedClient ? (
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--tg-muted)]">Подсказка</p>
          <p className="mt-2 text-sm text-[var(--tg-muted)]">Заметка привязывается к выбранному клиенту.</p>
        </Card>
      ) : null}
    </main>
  );
}

export function QuickNoteFlow(): ReactElement {
  const searchParams = useSearchParams();
  const initialClientId = searchParams.get("clientId");
  return <QuickNoteFlowInner key={initialClientId ?? ""} initialClientId={initialClientId} />;
}
