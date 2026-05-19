"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, type ReactElement } from "react";
import { OverviewDayStatsRow } from "@/components/overview/OverviewDayStatsRow";
import { OverviewEmptyDayContent } from "@/components/overview/OverviewEmptyDayContent";
import { OverviewHeader } from "@/components/overview/OverviewHeader";
import { OverviewLaterTodayList } from "@/components/overview/OverviewLaterTodayList";
import { OverviewNextWorkoutHero } from "@/components/overview/OverviewNextWorkoutHero";
import { OverviewWorkoutDraftCard } from "@/components/overview/OverviewWorkoutDraftCard";
import {
  formatOverviewHumanDate,
  rollupScheduleForDay,
  todayPendingSlotsSorted,
  upcomingPendingSlots,
} from "@/lib/overview/dailyOperations";
import { countClientsWithSessionDebt } from "@/lib/overview/overviewDayKpis";
import { countLaterTodayHidden } from "@/lib/overview/preWorkoutContext";
import type { MockScheduleItem } from "@/lib/mock/data";
import { MOCK_OVERVIEW_LATER_TODAY_LIMIT, mockTrainer } from "@/lib/mock/data";
import type { TrainlyDataSource } from "@/lib/config/dataSource";
import { CoreProductPaywallBanner } from "@/components/billing/CoreProductPaywallBanner";
import { isMockSubscriptionWriteBlocked } from "@/lib/billing/productAccessUi";
import { useMockApp } from "@/lib/mock/MockAppProvider";

export interface OverviewPageContentProps {
  trainlyDataMode: TrainlyDataSource;
}

export function OverviewPageContent({ trainlyDataMode }: OverviewPageContentProps): ReactElement {
  const router = useRouter();
  const {
    todayIso,
    clients,
    scheduleItems,
    overviewDraftPreview,
    consumeOverviewDraftBootstrap,
    clearOverviewWorkoutDraft,
    mockLifecycle,
    markOnboardingSeen,
  } = useMockApp();

  useEffect(() => {
    const key = "trainly-onboarding-overview-mark";
    try {
      if (sessionStorage.getItem(key) === "1") return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* sessionStorage недоступен */
    }
    void Promise.resolve(markOnboardingSeen());
  }, [markOnboardingSeen]);

  const scheduleRollup = useMemo(() => rollupScheduleForDay(scheduleItems, todayIso), [scheduleItems, todayIso]);

  const todaySlots = useMemo(
    () => todayPendingSlotsSorted(scheduleItems, todayIso),
    [scheduleItems, todayIso],
  );

  const isEmptyDay = todaySlots.length === 0;

  const nextSlot = useMemo(() => {
    const today = todayPendingSlotsSorted(scheduleItems, todayIso);
    return today[0];
  }, [scheduleItems, todayIso]);

  const aheadCount = useMemo(
    () => upcomingPendingSlots(scheduleItems, todayIso, 500).length,
    [scheduleItems, todayIso],
  );

  const showBusyFlow = !isEmptyDay && nextSlot != null;

  const laterSlots = useMemo(() => {
    if (!nextSlot) return [] as MockScheduleItem[];
    const idx = todaySlots.findIndex((s) => s.id === nextSlot.id);
    if (idx === -1) return todaySlots.slice(0, MOCK_OVERVIEW_LATER_TODAY_LIMIT);
    return todaySlots.slice(idx + 1, idx + 1 + MOCK_OVERVIEW_LATER_TODAY_LIMIT);
  }, [todaySlots, nextSlot]);

  const laterHiddenCount = useMemo(
    () => countLaterTodayHidden(scheduleItems, todayIso, nextSlot, laterSlots.length),
    [scheduleItems, todayIso, nextSlot, laterSlots.length],
  );

  const nextDateLine = useMemo(() => {
    if (!nextSlot || nextSlot.date === todayIso) return null;
    return formatOverviewHumanDate(nextSlot.date, todayIso);
  }, [nextSlot, todayIso]);

  const clientsWithDebt = useMemo(() => countClientsWithSessionDebt(clients), [clients]);

  const handleDraftContinue = (): void => {
    const ok = consumeOverviewDraftBootstrap();
    if (ok) router.push("/workout");
  };

  const nextStartHref = nextSlot
    ? `/start-workout?clientId=${encodeURIComponent(nextSlot.clientId)}&scheduleItemId=${encodeURIComponent(nextSlot.id)}`
    : "";

  const trainerDisplayName = useMemo(
    () => mockLifecycle.trainerProfile?.displayName.trim() || mockTrainer.firstName.trim() || "Тренер",
    [mockLifecycle.trainerProfile],
  );

  const trainerInitial = trainerDisplayName.slice(0, 1).toUpperCase();

  const draftActive = overviewDraftPreview != null;

  const expiredPaywallBanner = isMockSubscriptionWriteBlocked(mockLifecycle.mockSubscriptionStatus) ? (
    <CoreProductPaywallBanner trainlyDataMode={trainlyDataMode} demoExpiredHint />
  ) : null;

  if (clients.length === 0) {
    return (
      <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-6 px-4 py-6 pb-5">
        <OverviewHeader trainerDisplayName={trainerDisplayName} trainerInitial={trainerInitial} />
        {expiredPaywallBanner}
        <div className="trainly-surface-card premium-surface p-6">
          <p className="text-base font-semibold text-[var(--text-primary)]">Быстрый запуск</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            Добавьте клиента, создайте шаблон и сохраните первую тренировку.
          </p>
          <Link
            href="/clients/new"
            prefetch={false}
            className="app-cta-gradient app-btn mt-5 w-full min-h-[50px] px-4 py-3.5 text-[15px]"
          >
            Добавить клиента
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="overview-main flex h-full min-h-0 min-w-0 flex-1 flex-col px-4 py-3 pb-[calc(6rem+max(0.35rem,env(safe-area-inset-bottom,0px)))] sm:py-4">
      <OverviewHeader trainerDisplayName={trainerDisplayName} trainerInitial={trainerInitial} />

      {expiredPaywallBanner}

      <div className="overview-page flex min-h-0 min-w-0 flex-1 flex-col">
        {overviewDraftPreview != null ? (
          <OverviewWorkoutDraftCard
            draft={overviewDraftPreview}
            onContinue={handleDraftContinue}
            onDiscard={() => clearOverviewWorkoutDraft()}
          />
        ) : null}

        {isEmptyDay ? (
          <OverviewEmptyDayContent scheduleRollup={scheduleRollup} />
        ) : showBusyFlow && nextSlot ? (
          <>
            <OverviewNextWorkoutHero
              nextSlot={nextSlot}
              nextDateLine={nextDateLine}
              nextStartHref={nextStartHref}
              draftActive={draftActive}
            />
            <OverviewDayStatsRow
              scheduleRollup={scheduleRollup}
              aheadCount={aheadCount}
              clientsWithDebt={clientsWithDebt}
            />
            <OverviewLaterTodayList laterSlots={laterSlots} laterHiddenCount={laterHiddenCount} />
          </>
        ) : draftActive ? (
          <div className="trainly-surface-card premium-surface shrink-0 min-w-0 p-4 sm:p-5">
            <p className="text-sm text-[var(--tg-muted)]">Сначала завершите черновик выше.</p>
          </div>
        ) : (
          <OverviewEmptyDayContent scheduleRollup={scheduleRollup} />
        )}
      </div>
    </main>
  );
}
