"use client";

import { useEffect } from "react";
import type { WorkoutSessionState } from "@/lib/workout/types";

const AUTOSAVE_DEBOUNCE_MS = 3000;

export type SaveWorkoutDraftFn = (payload: {
  workoutId: string;
  session: WorkoutSessionState;
  status: "draft" | "in_progress";
  templateId?: string | null;
}) => Promise<{ ok: true } | { ok: false; error: string; conflictWorkoutId?: string }> | { ok: true } | { ok: false; error: string; conflictWorkoutId?: string };

/**
 * Debounced PG/mock autosave while logging. Отмена таймера при unmount или смене phase.
 */
export function useWorkoutDraftAutosave(params: {
  enabled: boolean;
  workoutId: string;
  templateId: string | null | undefined;
  session: WorkoutSessionState;
  sessionSignature: string;
  dirty: boolean;
  phase: "logging" | "summary";
  saveWorkoutDraft: SaveWorkoutDraftFn;
  onSaveError?: (message: string) => void;
}): void {
  const {
    enabled,
    workoutId,
    templateId,
    session,
    sessionSignature,
    dirty,
    phase,
    saveWorkoutDraft,
    onSaveError,
  } = params;

  useEffect(() => {
    if (!enabled || phase !== "logging" || !dirty) return;

    const timer = window.setTimeout(() => {
      void (async (): Promise<void> => {
        const res = await Promise.resolve(
          saveWorkoutDraft({
          workoutId,
          session: structuredClone(session),
          status: "in_progress",
          templateId: templateId ?? null,
          }),
        );
        if (!res.ok) {
          onSaveError?.(res.error);
        }
      })();
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
    // session намеренно не в deps: debounce по sessionSignature, не по ссылке объекта
    // eslint-disable-next-line react-hooks/exhaustive-deps -- autosave keyed by sessionSignature
  }, [enabled, workoutId, templateId, sessionSignature, dirty, phase, saveWorkoutDraft, onSaveError]);
}
