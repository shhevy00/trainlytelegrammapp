import type { ReactElement } from "react";
import { IconBolt, IconChipBalance, IconChipClock, IconChipJoint } from "@/components/overview/overviewIcons";
import type { OverviewRememberChip } from "@/lib/overview/overviewRememberChips";

function ChipIcon({ chipId }: { chipId: string }): ReactElement | null {
  const iconClass = "h-3.5 w-3.5 shrink-0 text-[var(--brand-violet)]";
  if (chipId === "balance") return <IconChipBalance className={iconClass} />;
  if (chipId === "limitation") return <IconChipJoint className={iconClass} />;
  if (chipId === "last") return <IconChipClock className={iconClass} />;
  if (chipId === "first") return <IconBolt className={iconClass} />;
  return null;
}

interface OverviewRememberChipRowProps {
  chips: readonly OverviewRememberChip[];
}

export function OverviewRememberChipRow({ chips }: OverviewRememberChipRowProps): ReactElement | null {
  if (chips.length === 0) return null;

  return (
    <div>
      <p className="overview-chips-label">Что учесть</p>
      <div className="overview-chips-row">
        {chips.map((chip) => (
          <span
            key={chip.id}
            className={chip.tone === "warning" ? "overview-chip overview-chip--warning" : "overview-chip"}
          >
            <ChipIcon chipId={chip.id} />
            {chip.label}
          </span>
        ))}
      </div>
    </div>
  );
}
