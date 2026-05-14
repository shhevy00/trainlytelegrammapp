import { Suspense, type ReactElement } from "react";
import { StartWorkoutFlow } from "@/components/start-workout/StartWorkoutFlow";

function StartFallback(): ReactElement {
  return (
    <div className="mx-auto w-full max-w-[480px] px-4 py-8 text-sm text-[var(--tg-muted)]">Загрузка…</div>
  );
}

export default function StartWorkoutPage(): ReactElement {
  return (
    <Suspense fallback={<StartFallback />}>
      <StartWorkoutFlow />
    </Suspense>
  );
}
