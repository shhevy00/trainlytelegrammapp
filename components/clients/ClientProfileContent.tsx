"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactElement } from "react";
import { ClientProfileHero } from "@/components/clients/ClientProfileHero";
import { ClientProfileHistoryTab } from "@/components/clients/ClientProfileHistoryTab";
import { ClientProfilePaymentsTab } from "@/components/clients/ClientProfilePaymentsTab";
import { ClientProfileProgressTab } from "@/components/clients/ClientProfileProgressTab";
import { ClientProfileQuickLinks } from "@/components/clients/ClientProfileQuickLinks";
import { buildClientProfileHeroModel } from "@/lib/clients/clientProfileHero";
import {
  computeProfileProgressDashboard,
  type ProfilePeriodKey,
} from "@/lib/clients/profileProgress";
import { resolveCoachPaidSessionsState } from "@/lib/coach/paidSessions";
import {
  getPlanSlotsForClientOnDate,
  getUpcomingSlotsForClientFromDate,
  resolveClientProfileScenario,
} from "@/lib/mock/clientProfileScenario";
import { useMockApp } from "@/lib/mock/MockAppProvider";
import type { JournalCompletedWorkout } from "@/lib/types";

const TAB_IDS = ["progress", "history", "payments"] as const;
type ProfileTab = (typeof TAB_IDS)[number];

const TAB_LABEL: Record<ProfileTab, string> = {
  progress: "Прогресс",
  history: "История",
  payments: "Оплата",
};

interface ClientProfileContentProps {
  clientId: string;
}

export function ClientProfileContent({ clientId }: ClientProfileContentProps): ReactElement {
  const router = useRouter();
  const [tab, setTab] = useState<ProfileTab>("progress");
  const [progressPeriod, setProgressPeriod] = useState<ProfilePeriodKey>("30");

  const {
    todayIso,
    clients,
    scheduleItems,
    prepareRepeatFromWorkout,
    getLatestCompletedWorkoutWithStructure,
    getJournalEntriesForClient,
    getCoachQuickNotesForClient,
    getCoachPaymentRecordsForClient,
    getTemplatesForClient,
  } = useMockApp();

  const client = useMemo(() => clients.find((c) => c.id === clientId), [clients, clientId]);

  const todaySlots = useMemo(
    () => getPlanSlotsForClientOnDate(scheduleItems, clientId, todayIso),
    [scheduleItems, clientId, todayIso],
  );

  const upcomingSlots = useMemo(
    () => getUpcomingSlotsForClientFromDate(scheduleItems, clientId, todayIso),
    [scheduleItems, clientId, todayIso],
  );

  const nextSlot = upcomingSlots[0];
  const clientJournal = useMemo(() => getJournalEntriesForClient(clientId), [getJournalEntriesForClient, clientId]);

  const journalWorkoutCount = useMemo(
    () => clientJournal.filter((e) => e.kind === "workout").length,
    [clientJournal],
  );

  const latestJournalWorkout = useMemo((): JournalCompletedWorkout | null => {
    const ws = clientJournal.filter((e): e is JournalCompletedWorkout => e.kind === "workout");
    if (ws.length === 0) return null;
    return ws.reduce((a, b) => (a.createdAtMs >= b.createdAtMs ? a : b));
  }, [clientJournal]);

  const scenario = client ? resolveClientProfileScenario(client) : "normal";

  const coachQuickNotes = useMemo(
    () => getCoachQuickNotesForClient(clientId),
    [getCoachQuickNotesForClient, clientId],
  );

  const coachPaymentLedger = useMemo(
    () => getCoachPaymentRecordsForClient(clientId),
    [getCoachPaymentRecordsForClient, clientId],
  );

  const paymentQuickNotes = useMemo(
    () => coachQuickNotes.filter((n) => n.type === "payment"),
    [coachQuickNotes],
  );

  const progressQuickNotes = useMemo(
    () => coachQuickNotes.filter((n) => n.type === "progress"),
    [coachQuickNotes],
  );

  const startHref = `/start-workout?clientId=${encodeURIComponent(clientId)}`;
  const addPaymentHref = `/add-payment?clientId=${encodeURIComponent(clientId)}`;
  const quickNoteHref = `/quick-note?clientId=${encodeURIComponent(clientId)}`;
  const scheduleHref = "/schedule";
  const templatesHref = `/clients/${encodeURIComponent(clientId)}/templates`;
  const activeTemplatesCount = useMemo(
    () => getTemplatesForClient(clientId).length,
    [getTemplatesForClient, clientId],
  );

  const latestStructured = useMemo(
    () => getLatestCompletedWorkoutWithStructure(clientId),
    [getLatestCompletedWorkoutWithStructure, clientId],
  );

  const progressDashboard = useMemo(() => {
    if (!client) return null;
    return computeProfileProgressDashboard(
      client.id,
      client.remainingSessions,
      clientJournal,
      progressPeriod,
      todayIso,
    );
  }, [client, clientJournal, progressPeriod, todayIso]);

  const heroModel = useMemo(() => {
    if (!client) return null;
    return buildClientProfileHeroModel({
      client,
      scenario,
      todayIso,
      todaySlots,
      nextSlot,
      journalWorkoutCount,
      canRepeat: latestStructured != null,
      startHref,
      addPaymentHref,
      quickNoteHref,
      scheduleHref,
    });
  }, [
    client,
    scenario,
    todayIso,
    todaySlots,
    nextSlot,
    journalWorkoutCount,
    latestStructured,
    startHref,
    addPaymentHref,
    quickNoteHref,
  ]);

  const onRepeatPrevious = (): void => {
    if (!latestStructured) return;
    const ok = prepareRepeatFromWorkout(latestStructured.id);
    if (ok) router.push("/workout");
  };

  const showPaymentQuickLink = client
    ? resolveCoachPaidSessionsState(client.remainingSessions) !== "paid_stable"
    : false;

  if (!client || !heroModel) {
    return (
      <main className="client-profile-page">
        <Link href="/clients" className="client-profile-back" prefetch={false}>
          ← Клиенты
        </Link>
        <div className="client-profile-empty">
          <p className="client-profile-empty__title">Клиент не найден</p>
          <p className="client-profile-empty__text">Нет клиента с таким идентификатором.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="client-profile-page">
      <Link href="/clients" className="client-profile-back" prefetch={false}>
        ← Клиенты
      </Link>

      <ClientProfileHero model={heroModel} onRepeat={onRepeatPrevious} />

      <ClientProfileQuickLinks
        templatesHref={templatesHref}
        templatesCount={activeTemplatesCount}
        scheduleHref={scheduleHref}
        addPaymentHref={addPaymentHref}
        showPaymentLink={showPaymentQuickLink}
      />

      <div className="client-profile-tabs" role="tablist" aria-label="Разделы профиля">
        {TAB_IDS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={["client-profile-tab", tab === id ? "client-profile-tab--active" : ""]
              .filter(Boolean)
              .join(" ")}
          >
            {TAB_LABEL[id]}
          </button>
        ))}
      </div>

      {tab === "progress" && progressDashboard ? (
        <ClientProfileProgressTab
          client={client}
          dashboard={progressDashboard}
          period={progressPeriod}
          onPeriodChange={setProgressPeriod}
          journalWorkoutCount={journalWorkoutCount}
          latestJournalWorkout={latestJournalWorkout}
          todayIso={todayIso}
          startHref={startHref}
          progressQuickNotes={progressQuickNotes}
          onOpenPayments={() => setTab("payments")}
        />
      ) : null}

      {tab === "history" ? (
        <ClientProfileHistoryTab
          entries={clientJournal}
          todayIso={todayIso}
          startHref={startHref}
          quickNoteHref={quickNoteHref}
        />
      ) : null}

      {tab === "payments" ? (
        <ClientProfilePaymentsTab
          client={client}
          ledger={coachPaymentLedger}
          paymentQuickNotes={paymentQuickNotes}
          todayIso={todayIso}
          addPaymentHref={addPaymentHref}
          quickNoteHref={quickNoteHref}
        />
      ) : null}
    </main>
  );
}
