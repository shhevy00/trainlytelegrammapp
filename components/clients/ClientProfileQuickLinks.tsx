"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { templatesCountLabel } from "@/lib/clients/clientProfileHero";

interface ClientProfileQuickLinksProps {
  templatesHref: string;
  templatesCount: number;
  scheduleHref: string;
  addPaymentHref: string;
  showPaymentLink: boolean;
}

export function ClientProfileQuickLinks({
  templatesHref,
  templatesCount,
  scheduleHref,
  addPaymentHref,
  showPaymentLink,
}: ClientProfileQuickLinksProps): ReactElement {
  return (
    <nav className="client-profile-quick" aria-label="Быстрые ссылки">
      <Link href={templatesHref} prefetch={false} className="client-profile-quick__item">
        <span className="client-profile-quick__label">Шаблоны</span>
        <span className="client-profile-quick__value">{templatesCountLabel(templatesCount)}</span>
      </Link>
      <Link href={scheduleHref} prefetch={false} className="client-profile-quick__item">
        <span className="client-profile-quick__label">График</span>
        <span className="client-profile-quick__value">Записи</span>
      </Link>
      {showPaymentLink ? (
        <Link href={addPaymentHref} prefetch={false} className="client-profile-quick__item client-profile-quick__item--accent">
          <span className="client-profile-quick__label">Оплата</span>
          <span className="client-profile-quick__value">Добавить</span>
        </Link>
      ) : null}
    </nav>
  );
}
