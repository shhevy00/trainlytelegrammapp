"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactElement } from "react";
import { useMockApp } from "@/lib/mock/MockAppProvider";

export function NewClientPageContent(): ReactElement {
  const router = useRouter();
  const { addClient } = useMockApp();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [remainingSessions, setRemainingSessions] = useState("0");
  const [limitation, setLimitation] = useState("");

  const onSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const sessions = Number.parseInt(remainingSessions.trim(), 10);
    const safeSessions = Number.isFinite(sessions) && sessions >= 0 ? sessions : 0;
    const id = await Promise.resolve(
      addClient({
        name: trimmed,
        goal: goal.trim() || undefined,
        remainingSessions: safeSessions,
        limitation: limitation.trim() || undefined,
      }),
    );
    router.push(`/clients/${encodeURIComponent(id)}`);
  };

  return (
    <main className="flex w-full flex-col gap-4 px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">Новый клиент</h1>
        <p className="mt-1 text-sm text-[var(--tg-muted)]">Минимальные поля — можно дополнить позже.</p>
      </header>

      <form className="flex flex-col gap-4" onSubmit={(e) => void onSubmit(e)}>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[var(--text-primary)]">Имя</span>
          <input
            required
            value={name}
            onChange={(ev) => setName(ev.target.value)}
            className="min-h-[44px] rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3 py-2 text-[15px] text-[var(--text-primary)] outline-none focus:border-[color:color-mix(in_srgb,var(--brand-solid),transparent_35%)]"
            placeholder="Например, Анна"
            autoComplete="name"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[var(--text-primary)]">Цель</span>
          <input
            value={goal}
            onChange={(ev) => setGoal(ev.target.value)}
            className="min-h-[44px] rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3 py-2 text-[15px] text-[var(--text-primary)] outline-none focus:border-[color:color-mix(in_srgb,var(--brand-solid),transparent_35%)]"
            placeholder="Необязательно"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[var(--text-primary)]">Осталось занятий</span>
          <input
            inputMode="numeric"
            value={remainingSessions}
            onChange={(ev) => setRemainingSessions(ev.target.value)}
            className="min-h-[44px] rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3 py-2 text-[15px] tabular-nums text-[var(--text-primary)] outline-none focus:border-[color:color-mix(in_srgb,var(--brand-solid),transparent_35%)]"
            placeholder="0"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[var(--text-primary)]">Ограничение / заметка</span>
          <textarea
            value={limitation}
            onChange={(ev) => setLimitation(ev.target.value)}
            rows={3}
            className="resize-none rounded-xl border border-[color:var(--border-soft)] bg-[var(--tg-bg)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[color:color-mix(in_srgb,var(--brand-solid),transparent_35%)]"
            placeholder="Необязательно"
          />
        </label>

        <button
          type="submit"
          className="app-btn mt-2 min-h-[48px] rounded-2xl bg-[var(--tg-accent)] px-4 py-3 text-center text-[15px] font-semibold text-white shadow-app-primary"
        >
          Сохранить клиента
        </button>
      </form>
    </main>
  );
}
