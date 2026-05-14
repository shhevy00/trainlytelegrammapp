"use client";

import { useState, type ReactElement, type ReactNode } from "react";
import { BottomNav } from "@/components/shell/BottomNav";
import { PlusSheet } from "@/components/shell/PlusSheet";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps): ReactElement {
  const [plusOpen, setPlusOpen] = useState(false);

  return (
    <>
      {/*
        Высота ровно вьюпорт: иначе колонка с min-h-dvh растёт с контентом, flex-1 + overflow-y-auto не получают
        ограниченную высоту и страница не прокручивается (html/body при этом overflow-hidden).
      */}
      <div className="flex h-dvh min-h-0 justify-center bg-transparent">
        <div className="flex h-full min-h-0 w-full max-w-[min(100%,480px)] flex-col overflow-hidden border-x border-[color:rgba(148,163,184,0.08)] bg-[color:color-mix(in_srgb,var(--bg-page),transparent_55%)] pt-[env(safe-area-inset-top,0px)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06),0_0_64px_rgba(0,0,0,0.45)] backdrop-blur-xl supports-[backdrop-filter]:bg-[color:color-mix(in_srgb,var(--bg-page),transparent_48%)]">
          <div className="app-scroll relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain pb-[calc(5.5rem+max(0.35rem,env(safe-area-inset-bottom,0px)))]">
            <div className="flex h-full min-h-0 min-w-0 w-full flex-1 flex-col">{children}</div>
          </div>
        </div>
      </div>
      <BottomNav onOpenPlus={() => setPlusOpen(true)} />
      <PlusSheet open={plusOpen} onClose={() => setPlusOpen(false)} />
    </>
  );
}
