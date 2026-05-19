"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import {
  coachClientSessionsBalanceShortRu,
  coachPaidSessionsHeadlineRu,
  coachPaidSessionsLabelRu,
  resolveCoachPaidSessionsState,
} from "@/lib/coach/paidSessions";
import { formatLastWorkoutRelative } from "@/lib/clients/profileProgress";
import type { CoachPaymentRecord, CoachQuickNote } from "@/lib/mock/coachLedger";
import type { MockClient } from "@/lib/mock/data";
import { formatJournalTime } from "@/lib/mock/journalSeed";
import { formatOverviewHumanDate } from "@/lib/overview/dailyOperations";

interface ClientProfilePaymentsTabProps {
  client: MockClient;
  ledger: readonly CoachPaymentRecord[];
  paymentQuickNotes: readonly CoachQuickNote[];
  todayIso: string;
  addPaymentHref: string;
  quickNoteHref: string;
}

export function ClientProfilePaymentsTab({
  client,
  ledger,
  paymentQuickNotes,
  todayIso,
  addPaymentHref,
  quickNoteHref,
}: ClientProfilePaymentsTabProps): ReactElement {
  const paidState = resolveCoachPaidSessionsState(client.remainingSessions);
  const paidHeadline = coachPaidSessionsHeadlineRu(paidState, client.remainingSessions);
  const hasHistory =
    ledger.length > 0 || (client.paymentHistoryMock != null && client.paymentHistoryMock.length > 0);

  return (
    <div className="client-profile-panel">
      <div className="client-profile-pay-balance">
        <p className="client-profile-pay-balance__label">Оплаченные занятия</p>
        <p
          className={[
            "client-profile-pay-balance__value",
            client.remainingSessions < 0
              ? "client-profile-pay-balance__value--debt"
              : client.remainingSessions === 0
                ? "client-profile-pay-balance__value--zero"
                : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {client.remainingSessions}
        </p>
        <p className="client-profile-pay-balance__hint">{coachClientSessionsBalanceShortRu(client.remainingSessions)}</p>
        <p className="client-profile-pay-balance__headline">{paidHeadline}</p>
        <p className="client-profile-pay-balance__sub">{coachPaidSessionsLabelRu(paidState)}</p>
        {client.lastPaymentSummary ? (
          <p className="client-profile-pay-balance__last">Последняя оплата: {client.lastPaymentSummary}</p>
        ) : null}
      </div>

      <div className="client-profile-pay-actions">
        <Link href={addPaymentHref} prefetch={false} className="app-btn client-profile-hero__btn-primary">
          Добавить оплату
        </Link>
        <Link href={quickNoteHref} prefetch={false} className="app-btn client-profile-hero__btn-secondary">
          Заметка об оплате
        </Link>
      </div>

      <div className="client-profile-notes">
        <p className="client-profile-notes__title">История оплат</p>
        {!hasHistory ? (
          <p className="client-profile-panel__hint">Оплат пока нет — добавьте пакет занятий.</p>
        ) : (
          <ul className="client-profile-notes__list">
            {ledger.map((row) => (
              <li key={row.id} className="client-profile-notes__item">
                <span className="client-profile-notes__when">
                  {formatLastWorkoutRelative(row.createdAtMs, todayIso)} · {formatJournalTime(row.createdAtMs)}
                </span>
                <span>
                  +{row.sessionsAdded} занятий
                  {row.amountRub != null ? ` · ${row.amountRub} ₽` : ""}
                </span>
                {row.comment ? <p className="client-profile-notes__comment">{row.comment}</p> : null}
              </li>
            ))}
            {client.paymentHistoryMock?.map((row) => (
              <li key={`mock-${row.dateIso}-${row.label}`} className="client-profile-notes__item">
                <span className="client-profile-notes__when">{formatOverviewHumanDate(row.dateIso, todayIso)}</span>
                <span> · {row.label}</span>
              </li>
            )) ?? null}
          </ul>
        )}
      </div>

      {paymentQuickNotes.length > 0 ? (
        <div className="client-profile-notes">
          <p className="client-profile-notes__title">Заметки об оплате</p>
          <ul className="client-profile-notes__list">
            {paymentQuickNotes.map((n) => (
              <li key={n.id} className="client-profile-notes__item">
                <span className="client-profile-notes__when">
                  {formatLastWorkoutRelative(n.createdAtMs, todayIso)} · {formatJournalTime(n.createdAtMs)}
                </span>
                <p>{n.text.trim()}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
