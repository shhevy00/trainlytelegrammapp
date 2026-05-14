import type { ReactElement, ReactNode } from "react";

/** Нижний отступ под BottomNav AppShell (как на профиле). */
export function ShellMain({ children }: { children: ReactNode }): ReactElement {
  return (
    <main className="flex min-h-0 w-full min-w-0 max-w-full flex-col gap-4 overflow-x-hidden px-4 py-6 pb-[calc(6rem+max(0.35rem,env(safe-area-inset-bottom,0px)))]">
      {children}
    </main>
  );
}
