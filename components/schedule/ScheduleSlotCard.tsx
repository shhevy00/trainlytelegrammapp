"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactElement } from "react";
import { IconClock, IconPlay, IconSkipForward, IconTrash } from "@/components/overview/overviewIcons";
import { clientInitial } from "@/lib/clients/clientListUi";
import { createEmptyWorkoutSessionForClient } from "@/lib/mock/startWorkoutSession";
import { useMockApp } from "@/lib/mock/MockAppProvider";
import type { MockScheduleItem, MockScheduleStatus } from "@/lib/mock/data";

const STATUS_SHORT: Record<Exclude<MockScheduleStatus, "completed">, string> = {
  planned: "План",
  upcoming: "План",
  missed: "Пропуск",
  cancelled: "Отмена",
};

interface ScheduleSlotCardProps {
  item: MockScheduleItem;
  onMissed: () => void;
  onCancelled: () => void;
}

export function ScheduleSlotCard({ item, onMissed, onCancelled }: ScheduleSlotCardProps): ReactElement {
  const router = useRouter();
  const { createWorkoutBootstrapFromTemplate, queueWorkoutBootstrap, getTemplateById, clients } = useMockApp();
  const [startError, setStartError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmMissed, setConfirmMissed] = useState(false);

  const isActive = item.status === "upcoming" || item.status === "planned";
  const isClosed = item.status === "missed" || item.status === "cancelled";

  const clientHref = `/clients/${encodeURIComponent(item.clientId)}`;
  const startHref = `/start-workout?clientId=${encodeURIComponent(item.clientId)}&scheduleItemId=${encodeURIComponent(item.id)}`;

  const statusClass = isClosed ? "schedule-slot__status--muted" : "schedule-slot__status--planned";

  const onStart = (): void => {
    setStartError(null);
    if (!item.templateId) {
      router.push(startHref);
      return;
    }
    const tpl = getTemplateById(item.templateId);
    if (!tpl || tpl.archivedAtIso || tpl.clientId !== item.clientId) {
      setStartError("Шаблон недоступен — можно начать без него.");
      return;
    }
    const res = createWorkoutBootstrapFromTemplate({
      clientId: item.clientId,
      templateId: item.templateId,
      scheduleItemId: item.id,
      titleOverride: item.title.trim() || item.templateName || tpl.name,
    });
    if (!res.ok) {
      setStartError(res.error);
      return;
    }
    router.push("/workout");
  };

  const onStartWithoutTemplate = (): void => {
    setStartError(null);
    const client = clients.find((c) => c.id === item.clientId);
    if (!client) return;
    queueWorkoutBootstrap({
      session: createEmptyWorkoutSessionForClient(client, `${item.title} · ${item.time}`, item.id),
      referenceHintsByExerciseName: {},
      rememberBlock: "",
      startSource: "schedule",
    });
    router.push("/workout");
  };

  const closedHint =
    item.status === "missed"
      ? "Занятие не списано"
      : item.status === "cancelled"
        ? "Запись отменена"
        : null;

  const metaLine = `${item.title} · ${item.durationMinutes} мин`;

  return (
    <article
      className={[
        "schedule-slot",
        "trainly-surface-card",
        isClosed ? "schedule-slot--muted" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="schedule-slot__head">
        <div className="schedule-slot__time-col">
          <span className="schedule-slot__time">{item.time}</span>
          <IconClock className="schedule-slot__time-icon" />
        </div>
        <span className="schedule-slot__divider" aria-hidden />
        <Link
          href={clientHref}
          prefetch={false}
          className="schedule-slot__profile"
          aria-label={`${item.clientName}, ${metaLine}. Открыть профиль`}
        >
          <span className="schedule-slot__avatar trainly-avatar" aria-hidden>
            {clientInitial(item.clientName)}
          </span>
          <span className="schedule-slot__info">
            <span className="schedule-slot__client">{item.clientName}</span>
            <span className="schedule-slot__meta">{metaLine}</span>
            {closedHint ? <span className="schedule-slot__hint">{closedHint}</span> : null}
          </span>
        </Link>
        <span className={`schedule-slot__status ${statusClass}`}>
          {item.status === "planned" || item.status === "upcoming"
            ? STATUS_SHORT[item.status]
            : STATUS_SHORT[item.status as "missed" | "cancelled"]}
        </span>
      </div>

      {isActive ? (
        <>
          <div className="trainly-surface-card__rule schedule-slot__rule" aria-hidden />
          <div className="schedule-slot__actions">
            {startError ? <p className="schedule-slot__error">{startError}</p> : null}
            <button type="button" className="trainly-cta-primary schedule-slot__start" onClick={onStart}>
              <IconPlay />
              Начать
            </button>
            {item.templateId && startError ? (
              <button type="button" className="schedule-slot__start-alt" onClick={onStartWithoutTemplate}>
                Без шаблона
              </button>
            ) : null}
            <div className="schedule-slot__secondary-row">
              {!confirmMissed ? (
                <button
                  type="button"
                  className="schedule-slot__secondary schedule-slot__secondary--skip"
                  onClick={() => setConfirmMissed(true)}
                >
                  <IconSkipForward />
                  Пропуск
                </button>
              ) : (
                <button
                  type="button"
                  className="schedule-slot__secondary schedule-slot__secondary--skip"
                  onClick={() => {
                    setConfirmMissed(false);
                    onMissed();
                  }}
                >
                  <IconSkipForward />
                  Подтвердить пропуск
                </button>
              )}
              {!confirmCancel ? (
                <button
                  type="button"
                  className="schedule-slot__secondary schedule-slot__secondary--cancel"
                  onClick={() => setConfirmCancel(true)}
                >
                  <IconTrash />
                  Отменить
                </button>
              ) : (
                <button
                  type="button"
                  className="schedule-slot__secondary schedule-slot__secondary--cancel"
                  onClick={() => {
                    setConfirmCancel(false);
                    onCancelled();
                  }}
                >
                  <IconTrash />
                  Подтвердить
                </button>
              )}
            </div>
          </div>
        </>
      ) : null}
    </article>
  );
}
