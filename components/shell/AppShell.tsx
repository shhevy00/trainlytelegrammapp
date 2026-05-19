"use client";

import type { ReactElement, ReactNode } from "react";
import { BottomNav } from "@/components/shell/BottomNav";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps): ReactElement {
  return (
    <>
      {/*
        Высота ровно вьюпорт: иначе колонка с min-h-dvh растёт с контентом, flex-1 + overflow-y-auto не получают
        ограниченную высоту и страница не прокручивается (html/body при этом overflow-hidden).
      */}
      <div className="flex h-dvh min-h-0 justify-center bg-transparent">
        <div className="trainly-app-shell relative flex h-full min-h-0 w-full max-w-[min(100%,480px)] flex-col overflow-hidden border-x border-[color:rgba(148,163,184,0.1)] pt-[env(safe-area-inset-top,0px)]">
          <div className="app-scroll relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain pb-[var(--trainly-bottom-nav-scroll-pad)]">
            <div className="flex h-full min-h-0 min-w-0 w-full flex-1 flex-col">{children}</div>
          </div>
        </div>
      </div>
      <BottomNav />
    </>
  );
}
