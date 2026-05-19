"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent, type ReactElement } from "react";
import { startOfIsoWeekMonday } from "@/lib/schedule/weekDates";
import type { MockClient } from "@/lib/mock/data";
import type { WorkoutTemplate } from "@/lib/workout/templates";

interface ScheduleAddFormProps {
  selectedDateIso: string;
  clients: MockClient[];
  getTemplatesForClient: (clientId: string) => WorkoutTemplate[];
  onDateChange: (iso: string, weekStartIso: string) => void;
  onSubmit: (payload: {
    clientId: string;
    time: string;
    title: string;
    durationMinutes: number;
    templateId?: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  onClose: () => void;
}

export function ScheduleAddForm({
  selectedDateIso,
  clients,
  getTemplatesForClient,
  onDateChange,
  onSubmit,
  onClose,
}: ScheduleAddFormProps): ReactElement {
  const [clientId, setClientId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [time, setTime] = useState("19:00");
  const [title, setTitle] = useState("Тренировка");
  const [duration, setDuration] = useState("60");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const templates = useMemo(
    () => (clientId ? getTemplatesForClient(clientId) : []),
    [clientId, getTemplatesForClient],
  );

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    if (!clientId) {
      setError("Выберите клиента.");
      return;
    }
    const t = time.trim();
    if (!/^\d{1,2}:\d{2}$/.test(t)) {
      setError("Время: ЧЧ:ММ, например 18:30.");
      return;
    }
    const dur = Number.parseInt(duration.trim(), 10);
    setPending(true);
    const result = await onSubmit({
      clientId,
      time: t,
      title: title.trim() || "Тренировка",
      durationMinutes: Number.isFinite(dur) ? dur : 60,
      ...(templateId.trim() ? { templateId: templateId.trim() } : {}),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onClose();
  };

  return (
    <div className="schedule-add-panel">
      <div className="schedule-add-panel__head">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Новая запись</h2>
        <button type="button" className="schedule-add-panel__close" onClick={onClose} aria-label="Закрыть">
          ✕
        </button>
      </div>
      <form className="schedule-add-form" onSubmit={(e) => void handleSubmit(e)}>
        <label className="schedule-field">
          <span>День</span>
          <input
            type="date"
            value={selectedDateIso}
            onChange={(ev) => {
              const v = ev.target.value;
              if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return;
              onDateChange(v, startOfIsoWeekMonday(v));
            }}
          />
        </label>
        <label className="schedule-field">
          <span>Клиент</span>
          <select
            value={clientId}
            onChange={(ev) => {
              setClientId(ev.target.value);
              setTemplateId("");
            }}
          >
            <option value="">Выберите клиента</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        {clientId && templates.length > 0 ? (
          <label className="schedule-field">
            <span>Шаблон</span>
            <select
              value={templateId}
              onChange={(ev) => {
                const v = ev.target.value;
                setTemplateId(v);
                const t = templates.find((x) => x.id === v);
                if (t) setTitle((prev) => (prev.trim() === "" ? t.name : prev));
              }}
            >
              <option value="">Без шаблона</option>
              {templates.map((tm) => (
                <option key={tm.id} value={tm.id}>
                  {tm.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {clientId && templates.length === 0 ? (
          <p className="text-xs text-[var(--tg-muted)]">
            <Link
              href={`/clients/${encodeURIComponent(clientId)}/templates/new`}
              prefetch={false}
              className="font-semibold text-[var(--brand-solid)]"
            >
              Создать шаблон
            </Link>
          </p>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          <label className="schedule-field">
            <span>Время</span>
            <input value={time} onChange={(ev) => setTime(ev.target.value)} inputMode="numeric" placeholder="18:30" />
          </label>
          <label className="schedule-field">
            <span>Минут</span>
            <input value={duration} onChange={(ev) => setDuration(ev.target.value)} inputMode="numeric" />
          </label>
        </div>
        <label className="schedule-field">
          <span>Название</span>
          <input value={title} onChange={(ev) => setTitle(ev.target.value)} />
        </label>
        {error ? <p className="text-sm text-[var(--warning)]">{error}</p> : null}
        <button type="submit" disabled={pending} className="app-btn schedule-add-submit">
          {pending ? "Сохранение…" : "Добавить в график"}
        </button>
      </form>
    </div>
  );
}
