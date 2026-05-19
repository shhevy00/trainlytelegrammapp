import type { ReactElement } from "react";
import { WorkoutLogger } from "@/components/workout/WorkoutLogger";

export default function WorkoutPage(): ReactElement {
  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <WorkoutLogger />
    </div>
  );
}

