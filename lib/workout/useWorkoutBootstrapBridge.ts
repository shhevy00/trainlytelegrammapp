"use client";

import { useCallback, useRef, useState } from "react";
import { normalizeWorkoutBootstrap, type WorkoutLoggerBootstrap } from "@/lib/workout/templates";

/** Превью черновика тренировки для Overview (в памяти вкладки). */
export interface OverviewDraftPreview {
  clientId: string;
  clientName: string;
  title: string;
  startedAtMs: number;
  updatedAtMs: number;
}

export interface WorkoutBootstrapBridge {
  overviewDraftPreview: OverviewDraftPreview | null;
  consumeWorkoutBootstrap: () => WorkoutLoggerBootstrap | null;
  queueWorkoutBootstrap: (bootstrap: WorkoutLoggerBootstrap) => void;
  syncOverviewWorkoutDraft: (bootstrap: WorkoutLoggerBootstrap | null) => void;
  clearOverviewWorkoutDraft: () => void;
  consumeOverviewDraftBootstrap: () => boolean;
}

/**
 * Общая логика очереди bootstrap для WorkoutLogger (mock + live).
 * Повтор bootstrap до microtask — для React Strict Mode (двойной mount).
 */
export function useWorkoutBootstrapBridge(): WorkoutBootstrapBridge {
  const bootstrapRef = useRef<WorkoutLoggerBootstrap | null>(null);
  const bootstrapReplayUntilMicrotaskRef = useRef<WorkoutLoggerBootstrap | null>(null);
  const bootstrapReplayClearScheduledRef = useRef(false);

  const scheduleBootstrapReplayClear = useCallback((): void => {
    if (bootstrapReplayClearScheduledRef.current) return;
    bootstrapReplayClearScheduledRef.current = true;
    queueMicrotask(() => {
      bootstrapReplayClearScheduledRef.current = false;
      bootstrapReplayUntilMicrotaskRef.current = null;
    });
  }, []);

  const clearBootstrapReplay = useCallback((): void => {
    bootstrapReplayUntilMicrotaskRef.current = null;
    bootstrapReplayClearScheduledRef.current = false;
  }, []);

  const overviewDraftBootstrapRef = useRef<WorkoutLoggerBootstrap | null>(null);
  const [overviewDraftPreview, setOverviewDraftPreview] = useState<OverviewDraftPreview | null>(null);

  const consumeWorkoutBootstrap = useCallback((): WorkoutLoggerBootstrap | null => {
    if (bootstrapRef.current != null) {
      const b = normalizeWorkoutBootstrap(bootstrapRef.current);
      bootstrapRef.current = null;
      bootstrapReplayUntilMicrotaskRef.current = b;
      scheduleBootstrapReplayClear();
      return b;
    }
    const replay = bootstrapReplayUntilMicrotaskRef.current;
    if (replay != null) {
      return normalizeWorkoutBootstrap(replay);
    }
    return null;
  }, [scheduleBootstrapReplayClear]);

  const queueWorkoutBootstrap = useCallback(
    (bootstrap: WorkoutLoggerBootstrap): void => {
      clearBootstrapReplay();
      bootstrapRef.current = normalizeWorkoutBootstrap(bootstrap);
    },
    [clearBootstrapReplay],
  );

  const syncOverviewWorkoutDraft = useCallback((bootstrap: WorkoutLoggerBootstrap | null): void => {
    overviewDraftBootstrapRef.current = bootstrap ? normalizeWorkoutBootstrap(bootstrap) : null;
    if (!bootstrap) {
      setOverviewDraftPreview((prev) => (prev == null ? prev : null));
      return;
    }
    const nextPreview = {
      clientId: bootstrap.session.clientId,
      clientName: bootstrap.session.clientName,
      title: bootstrap.session.title,
      startedAtMs: bootstrap.session.startedAtMs,
      updatedAtMs: Date.now(),
    };
    setOverviewDraftPreview((prev) => {
      if (
        prev != null &&
        prev.clientId === nextPreview.clientId &&
        prev.clientName === nextPreview.clientName &&
        prev.title === nextPreview.title &&
        prev.startedAtMs === nextPreview.startedAtMs
      ) {
        return prev;
      }
      return nextPreview;
    });
  }, []);

  const clearOverviewWorkoutDraft = useCallback((): void => {
    overviewDraftBootstrapRef.current = null;
    setOverviewDraftPreview(null);
  }, []);

  const consumeOverviewDraftBootstrap = useCallback((): boolean => {
    const b = overviewDraftBootstrapRef.current;
    if (!b) return false;
    overviewDraftBootstrapRef.current = null;
    setOverviewDraftPreview(null);
    clearBootstrapReplay();
    bootstrapRef.current = normalizeWorkoutBootstrap(b);
    return true;
  }, [clearBootstrapReplay]);

  return {
    overviewDraftPreview,
    consumeWorkoutBootstrap,
    queueWorkoutBootstrap,
    syncOverviewWorkoutDraft,
    clearOverviewWorkoutDraft,
    consumeOverviewDraftBootstrap,
  };
}
