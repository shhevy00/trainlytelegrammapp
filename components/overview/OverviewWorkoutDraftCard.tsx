import Link from "next/link";
import type { ReactElement } from "react";
import { btnGradientStart, btnHeroSecondary } from "@/components/overview/overviewCtaStyles";
import { IconPlay } from "@/components/overview/overviewIcons";
import { formatJournalDayLabel, formatJournalTime } from "@/lib/mock/journalSeed";

export interface OverviewDraftPreview {
  clientName: string;
  title: string;
  startedAtMs: number;
}

interface OverviewWorkoutDraftCardProps {
  draft: OverviewDraftPreview;
  onContinue: () => void;
  onDiscard: () => void;
}

export function OverviewWorkoutDraftCard({
  draft,
  onContinue,
  onDiscard,
}: OverviewWorkoutDraftCardProps): ReactElement {
  return (
    <div className="trainly-surface-card premium-surface shrink-0 p-4 sm:p-5">
      <p className="text-xs font-medium text-[var(--tg-muted)]">Черновик</p>
      <p className="mt-1 font-display text-xl font-bold text-[var(--text-primary)]">{draft.clientName}</p>
      <p className="mt-0.5 text-sm text-[var(--tg-muted)]">{draft.title}</p>
      <p className="mt-2 text-xs text-[var(--tg-muted)]">
        {formatJournalDayLabel(draft.startedAtMs)} · {formatJournalTime(draft.startedAtMs)}
      </p>
      <div className="mt-4 flex flex-col gap-3">
        <button type="button" className={`${btnGradientStart} w-full`} onClick={onContinue}>
          <IconPlay />
          Продолжить
        </button>
        <Link href="/schedule" prefetch={false} className={btnHeroSecondary}>
          Открыть график
        </Link>
        <button
          type="button"
          className="text-center text-xs font-medium text-[var(--tg-muted)] underline"
          onClick={onDiscard}
        >
          Удалить черновик
        </button>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-[var(--tg-muted)]">
        Черновик действует до закрытия вкладки браузера.
      </p>
    </div>
  );
}
