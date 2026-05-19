"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { IconClipboard, IconClock, IconMoreHorizontal } from "@/components/overview/overviewIcons";
import type { ClientCardMeta } from "@/lib/clients/clientListUi";
import { clientInitial } from "@/lib/clients/clientListUi";
import type { MockClient } from "@/lib/mock/data";

interface ClientListCardProps {
  client: MockClient;
  meta: ClientCardMeta;
}

export function ClientListCard({ client, meta }: ClientListCardProps): ReactElement {
  const profileHref = `/clients/${encodeURIComponent(client.id)}`;
  const startHref = `/start-workout?clientId=${encodeURIComponent(client.id)}&mode=client`;

  const cardClass = [
    "clients-card",
    "trainly-surface-card",
    meta.isToday ? "trainly-surface-card--accent clients-card--today" : "",
    meta.balanceTone !== "paid_stable" ? `clients-card--balance-${meta.balanceTone}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const hasSchedule = meta.scheduleLine !== "Нет записи в графике";

  return (
    <article className={cardClass}>
      <div className="clients-card__header">
        <Link
          href={profileHref}
          prefetch={false}
          className="clients-card__identity"
          aria-label={`${client.name}. ${meta.scheduleLine}. ${meta.balanceTitle}. Открыть профиль`}
        >
          <span className="clients-card__avatar trainly-avatar" aria-hidden>
            {clientInitial(client.name)}
          </span>
          <span className="clients-card__title-block">
            <span className="clients-card__name-row">
              <span className="clients-card__name">{client.name}</span>
              {meta.isToday ? <span className="clients-card__today-badge">Сегодня</span> : null}
            </span>
          </span>
        </Link>
        <span
          className={`clients-card__balance clients-card__balance--${meta.balanceTone}`}
          title={meta.balanceTitle}
        >
          <span className="clients-card__balance-prefix">{meta.balancePrefix}</span>
          <span className="clients-card__balance-num">{meta.balanceNumber}</span>
        </span>
      </div>

      <div className="clients-card__details">
        <p className={`clients-card__schedule ${hasSchedule ? "" : "clients-card__schedule--muted"}`}>
          <IconClock className="clients-card__row-icon" />
          <span>{meta.scheduleLine}</span>
        </p>
        {meta.noteLine ? (
          <p className="clients-card__note">
            <IconClipboard className="clients-card__row-icon" />
            <span>{meta.noteLine}</span>
          </p>
        ) : null}
      </div>

      <div className="trainly-surface-card__rule clients-card__rule" aria-hidden />

      {meta.balanceTone === "zero_sessions" || meta.balanceTone === "debt" ? (
        <Link
          href={`/add-payment?clientId=${encodeURIComponent(client.id)}`}
          prefetch={false}
          className="clients-card__payment-link text-sm font-semibold text-[var(--brand-solid)]"
        >
          Добавить оплату
        </Link>
      ) : null}

      <div className="clients-card__footer">
        <Link href={startHref} prefetch={false} className="trainly-cta-primary clients-card__start">
          Начать
        </Link>
        <Link href={profileHref} prefetch={false} className="trainly-cta-icon clients-card__more" aria-label={`${client.name}: ещё`}>
          <IconMoreHorizontal />
        </Link>
      </div>
    </article>
  );
}
