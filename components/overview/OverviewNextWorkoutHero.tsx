import Link from "next/link";
import type { ReactElement } from "react";
import { OverviewDecorImage } from "@/components/overview/OverviewDecorImage";
import { IconBolt, IconPlay } from "@/components/overview/overviewIcons";
import type { MockScheduleItem } from "@/lib/mock/data";
import { OVERVIEW_DECOR_DUMBBELL } from "@/lib/overview/overviewDecorPaths";
import { nextSessionSubtitle } from "@/lib/overview/overviewSlotDisplay";

interface OverviewNextWorkoutHeroProps {
  nextSlot: MockScheduleItem;
  nextDateLine: string | null;
  nextStartHref: string;
  draftActive: boolean;
}

export function OverviewNextWorkoutHero({
  nextSlot,
  nextDateLine,
  nextStartHref,
  draftActive,
}: OverviewNextWorkoutHeroProps): ReactElement {
  return (
    <section className="overview-card overview-hero-card" aria-label="Следующая тренировка">
      <div className="overview-hero-main">
        <div className="overview-hero-kicker">
          <IconBolt className="text-[var(--brand-violet)]" />
          Следующая тренировка
        </div>
        {nextDateLine ? <p className="overview-hero-date">{nextDateLine}</p> : null}
        <p className="overview-hero-time tabular-nums">{nextSlot.time}</p>
        <p className="overview-hero-client">{nextSlot.clientName}</p>
        <p className="overview-hero-subtitle">{nextSessionSubtitle(nextSlot)}</p>

        {!draftActive ? (
          <Link href={nextStartHref} prefetch={false} className="overview-btn-start overview-hero-actions">
            <IconPlay />
            Начать
          </Link>
        ) : (
          <p className="mt-4 text-xs leading-relaxed text-[var(--tg-muted)]">
            Сначала завершите черновик выше — затем можно начать по записи.
          </p>
        )}
      </div>
      <OverviewDecorImage src={OVERVIEW_DECOR_DUMBBELL} variant="hero" />
    </section>
  );
}
