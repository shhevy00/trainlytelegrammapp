import { Suspense, type ReactElement } from "react";
import { QuickNoteFlow } from "@/components/quick-note/QuickNoteFlow";

function QuickNoteFallback(): ReactElement {
  return (
    <div className="mx-auto w-full max-w-[480px] px-4 py-8 text-sm text-[var(--tg-muted)]">Загрузка…</div>
  );
}

export default function QuickNotePage(): ReactElement {
  return (
    <Suspense fallback={<QuickNoteFallback />}>
      <QuickNoteFlow />
    </Suspense>
  );
}
