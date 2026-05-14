"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent, type ReactElement } from "react";
import { Card } from "@/components/ui/card";
import { useMockApp } from "@/lib/mock/MockAppProvider";
import { coachClientSessionsBalanceShortRu } from "@/lib/coach/paidSessions";

const btnPrimary =
  "app-btn rounded-2xl bg-[var(--tg-accent)] px-4 py-3 text-center text-white shadow-app-primary disabled:opacity-40";
const btnGhost =
  "app-btn rounded-2xl border border-[color:var(--border-strong)] bg-[var(--tg-bg)] px-4 py-3 text-center text-[var(--text-primary)]";

interface AddPaymentFlowInnerProps {
  initialClientId: string | null;
}

function AddPaymentFlowInner({ initialClientId }: AddPaymentFlowInnerProps): ReactElement {
  const router = useRouter();
  const { clients, recordCoachPayment } = useMockApp();

  const [clientId, setClientId] = useState<string>(() => initialClientId ?? "");
  const [sessionsRaw, setSessionsRaw] = useState<string>("1");
  const [amountRaw, setAmountRaw] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<null | { clientName: string; added: number; remaining: number }>(null);

  const selectedClient = useMemo(() => clients.find((c) => c.id === clientId), [clients, clientId]);

  const onSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    if (!clientId) {
      setError("Выберите клиента.");
      return;
    }
    const client = clients.find((c) => c.id === clientId);
    if (!client) {
      setError("Клиент не найден.");
      return;
    }
    const sessionsAdded = Number.parseInt(sessionsRaw.replace(",", ".").trim(), 10);
    if (!Number.isFinite(sessionsAdded) || sessionsAdded < 1) {
      setError("Укажите число занятий не меньше 1.");
      return;
    }
    const amountTrim = amountRaw.trim();
    let amountRub: number | null = null;
    if (amountTrim.length > 0) {
      const parsed = Number.parseFloat(amountTrim.replace(",", "."));
      if (!Number.isFinite(parsed) || parsed < 0) {
        setError("Сумма должна быть неотрицательным числом или оставьте поле пустым.");
        return;
      }
      amountRub = parsed;
    }
    const commentTrimmed = comment.trim().length > 0 ? comment.trim() : null;

    const remainingBefore = client.remainingSessions;
    await Promise.resolve(
      recordCoachPayment({
        clientId: client.id,
        clientName: client.name,
        sessionsAdded,
        amountRub,
        comment: commentTrimmed,
      }),
    );
    const remainingAfter = remainingBefore + sessionsAdded;
    setDone({ clientName: client.name, added: sessionsAdded, remaining: remainingAfter });
  };

  if (done) {
    return (
      <main className="flex w-full flex-col gap-4 px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
        <header>
          <h1 className="font-display text-2xl font-bold tracking-tight">Оплата занятий</h1>
        </header>
        <Card className="flex flex-col gap-3">
          <p className="text-base leading-relaxed text-[var(--tg-text)]">
            Готово.
            <br />
            {done.clientName}: +{done.added} занятий.
            <br />
            Сейчас: {coachClientSessionsBalanceShortRu(done.remaining)}.
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Link
              href={`/clients/${encodeURIComponent(clientId)}`}
              prefetch={false}
              className={`flex-1 ${btnPrimary} text-center`}
            >
              Открыть клиента
            </Link>
            <Link href={`/add-payment?clientId=${encodeURIComponent(clientId)}`} prefetch={false} className={`flex-1 ${btnGhost}`}>
              Ещё оплату
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
        <h1 className="font-display text-2xl font-bold tracking-tight">Добавить оплату</h1>
        <p className="text-sm text-[var(--tg-muted)]">
          Оплата клиента: пополнение остатка занятий. Доступ к приложению Trainly оплачивается отдельно.
        </p>
      </header>

      <Card>
        <form className="flex flex-col gap-4" onSubmit={(e) => void onSubmit(e)}>
          <div>
            <label htmlFor="pay-client" className="text-sm font-medium text-[var(--tg-text)]">
              Клиент
            </label>
            <select
              id="pay-client"
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
            <label htmlFor="pay-sessions" className="text-sm font-medium text-[var(--tg-text)]">
              Число занятий
            </label>
            <input
              id="pay-sessions"
              inputMode="numeric"
              className="mt-2 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3 py-3 text-sm text-[var(--tg-text)] outline-none focus:border-[color:color-mix(in_srgb,var(--brand-solid),transparent_35%)]"
              value={sessionsRaw}
              onChange={(e) => setSessionsRaw(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="pay-amount" className="text-sm font-medium text-[var(--tg-text)]">
              Сумма ₽ <span className="font-normal text-[var(--tg-muted)]">необязательно</span>
            </label>
            <input
              id="pay-amount"
              inputMode="decimal"
              placeholder="Пусто — только занятия"
              className="mt-2 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3 py-3 text-sm text-[var(--tg-text)] outline-none focus:border-[color:color-mix(in_srgb,var(--brand-solid),transparent_35%)]"
              value={amountRaw}
              onChange={(e) => setAmountRaw(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="pay-comment" className="text-sm font-medium text-[var(--tg-text)]">
              Комментарий <span className="font-normal text-[var(--tg-muted)]">необязательно</span>
            </label>
            <textarea
              id="pay-comment"
              rows={3}
              className="mt-2 w-full resize-none rounded-2xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3 py-3 text-sm text-[var(--tg-text)] outline-none focus:border-[color:color-mix(in_srgb,var(--brand-solid),transparent_35%)]"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          {selectedClient ? (
            <p className="text-xs text-[var(--tg-muted)]">
            Сейчас у клиента:{" "}
            <span className="font-semibold text-[var(--tg-text)]">
              {coachClientSessionsBalanceShortRu(selectedClient.remainingSessions)}
            </span>
            </p>
          ) : null}

          {error ? <p className="text-sm text-[var(--warning)]">{error}</p> : null}

          <button type="submit" className={btnPrimary}>
            Сохранить
          </button>
        </form>
      </Card>
    </main>
  );
}

export function AddPaymentFlow(): ReactElement {
  const searchParams = useSearchParams();
  const initialClientId = searchParams.get("clientId");
  return <AddPaymentFlowInner key={initialClientId ?? ""} initialClientId={initialClientId} />;
}
