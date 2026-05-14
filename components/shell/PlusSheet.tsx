"use client";

import { useEffect, type ReactElement } from "react";
import { TrainlyNavAnchor } from "@/components/navigation/TrainlyNavAnchor";

interface PlusSheetProps {
  open: boolean;
  onClose: () => void;
}

const navReserve = "calc(5rem + max(0.5rem, env(safe-area-inset-bottom, 0px)))";

const primaryActions: { label: string; hint: string; href: string }[] = [
  { label: "Новый клиент", hint: "Карточка клиента", href: "/clients/new" },
  { label: "Клиент + тренировка", hint: "Сначала клиент", href: "/start-workout?mode=client" },
  { label: "Новая тренировка", hint: "Быстрый старт", href: "/start-workout?mode=quick" },
  { label: "Добавить оплату", hint: "Остаток занятий", href: "/add-payment" },
  { label: "Быстрая заметка", hint: "Пульс и напоминания", href: "/quick-note" },
];

export function PlusSheet({ open, onClose }: PlusSheetProps): ReactElement | null {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) {
    return null;
  }

  const btnClsEnabled =
    "app-btn flex min-h-[44px] w-full flex-col justify-center rounded-2xl border border-[color:var(--border-strong)] bg-[var(--bg-card-elevated)] px-4 py-3 text-left text-[var(--text-primary)] transition hover:border-[color:color-mix(in_srgb,var(--brand-solid),transparent_55%)] active:scale-[0.99]";

  return (
    <div className="fixed inset-0 z-[45] flex flex-col justify-end" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        aria-label="Закрыть"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="plus-sheet-title"
        style={{ marginBottom: navReserve }}
        className="relative mx-auto w-full max-w-[min(100%,480px)] rounded-t-[1.25rem] border border-[color:var(--border-strong)] bg-[var(--bg-sheet)] p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] shadow-[0_-16px_48px_rgba(0,0,0,0.45)]"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[color:var(--border-strong)]" />
        <h2 id="plus-sheet-title" className="app-card-title mb-0.5">
          Действия
        </h2>
        <p className="app-muted mb-4">Частые шаги.</p>
        <ul className="app-scroll flex max-h-[min(70vh,520px)] flex-col gap-2 overflow-y-auto overscroll-contain pr-0.5">
          {primaryActions.map((a) => (
            <li key={a.label}>
              <TrainlyNavAnchor href={a.href} onClick={onClose} className={btnClsEnabled}>
                <span className="font-medium text-[var(--tg-text)]">{a.label}</span>
                <span className="text-sm text-[var(--tg-muted)]">{a.hint}</span>
              </TrainlyNavAnchor>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
