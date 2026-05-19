import type { ReactElement } from "react";
import { TrainlyNavAnchor } from "@/components/navigation/TrainlyNavAnchor";
import { QUICK_ACTIONS, type QuickActionId } from "@/lib/navigation/quickActions";

interface ScreenQuickBarProps {
  actionIds: readonly QuickActionId[];
  /** Короткая подпись для accessibility */
  ariaLabel?: string;
}

export function ScreenQuickBar({
  actionIds,
  ariaLabel = "Быстрые действия",
}: ScreenQuickBarProps): ReactElement {
  return (
    <nav
      className="screen-quick-bar app-scroll -mx-4 flex gap-2 overflow-x-auto overscroll-x-contain px-4 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label={ariaLabel}
    >
      {actionIds.map((id) => {
        const action = QUICK_ACTIONS[id];
        return (
          <TrainlyNavAnchor key={id} href={action.href} className="screen-quick-chip">
            {action.label}
          </TrainlyNavAnchor>
        );
      })}
    </nav>
  );
}
