"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import type { TrainlyDataSource } from "@/lib/config/dataSource";

interface CoreProductPaywallBannerProps {
  trainlyDataMode: TrainlyDataSource;
  /** Демо: «истёк» в mock lifecycle; live: то же поле в snapshot. */
  demoExpiredHint?: boolean;
}

export function CoreProductPaywallBanner({
  trainlyDataMode,
  demoExpiredHint = false,
}: CoreProductPaywallBannerProps): ReactElement {
  return (
    <div
      className="shrink-0 rounded-2xl border border-[color:color-mix(in_srgb,var(--warning),transparent_45%)] bg-[color:color-mix(in_srgb,var(--warning),transparent_88%)] p-3 text-sm text-[var(--text-primary)]"
      role="status"
    >
      <p className="font-medium leading-snug">
        {trainlyDataMode === "mock" && demoExpiredHint
          ? "Демо: доступ истёк. Так будет выглядеть экран продления подписки."
          : "Доступ к Trainly истёк. Оформите тариф, чтобы продолжить работу в дневнике."}
      </p>
      <Link
        href="/billing/plans"
        prefetch={false}
        className="trainly-cta-primary app-btn mt-2 flex min-h-[44px] w-full items-center justify-center px-3 py-2.5 text-center text-sm font-bold"
      >
        Выбрать тариф
      </Link>
    </div>
  );
}
