"use client";

import type { ReactElement } from "react";
import type { TrainlyDataSource } from "@/lib/config/dataSource";
import { CoreProductPaywallBanner } from "@/components/billing/CoreProductPaywallBanner";
import { isMockSubscriptionWriteBlocked } from "@/lib/billing/productAccessUi";
import { useMockApp } from "@/lib/mock/MockAppProvider";

interface ProductAccessPaywallProps {
  trainlyDataMode: TrainlyDataSource;
}

/** Единый баннер при истёкшей/отменённой подписке (mock lifecycle / live snapshot). */
export function ProductAccessPaywall({ trainlyDataMode }: ProductAccessPaywallProps): ReactElement | null {
  const { mockLifecycle } = useMockApp();
  if (!isMockSubscriptionWriteBlocked(mockLifecycle.mockSubscriptionStatus)) {
    return null;
  }
  return (
    <CoreProductPaywallBanner
      trainlyDataMode={trainlyDataMode}
      demoExpiredHint={trainlyDataMode === "mock"}
    />
  );
}
