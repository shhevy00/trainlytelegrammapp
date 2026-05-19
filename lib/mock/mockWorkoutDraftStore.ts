import type { WorkoutSessionState } from "@/lib/workout/types";

const STORAGE_KEY = "trainly-mock-workout-drafts-v1";

export interface MockPersistedWorkoutDraft {
  workoutId: string;
  session: WorkoutSessionState;
  status: "draft" | "in_progress";
  templateId: string | null;
}

interface StoredShape {
  byWorkoutId: Record<string, MockPersistedWorkoutDraft>;
  clientToWorkoutId: Record<string, string>;
}

function emptyStore(): StoredShape {
  return { byWorkoutId: {}, clientToWorkoutId: {} };
}

function readStore(): StoredShape {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw == null) return emptyStore();
    const parsed = JSON.parse(raw) as StoredShape;
    if (typeof parsed !== "object" || parsed == null) return emptyStore();
    return {
      byWorkoutId: parsed.byWorkoutId ?? {},
      clientToWorkoutId: parsed.clientToWorkoutId ?? {},
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(store: StoredShape): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* quota / private mode */
  }
}

export function saveMockWorkoutDraft(draft: MockPersistedWorkoutDraft): void {
  const store = readStore();
  const prevId = store.clientToWorkoutId[draft.session.clientId];
  if (prevId != null && prevId !== draft.workoutId) {
    delete store.byWorkoutId[prevId];
  }
  store.byWorkoutId[draft.workoutId] = draft;
  store.clientToWorkoutId[draft.session.clientId] = draft.workoutId;
  writeStore(store);
}

export function loadMockWorkoutDraftByClientId(clientId: string): MockPersistedWorkoutDraft | null {
  const store = readStore();
  const workoutId = store.clientToWorkoutId[clientId];
  if (workoutId == null) return null;
  return store.byWorkoutId[workoutId] ?? null;
}

export function deleteMockWorkoutDraft(workoutId: string): void {
  const store = readStore();
  const draft = store.byWorkoutId[workoutId];
  if (draft != null) {
    delete store.clientToWorkoutId[draft.session.clientId];
  }
  delete store.byWorkoutId[workoutId];
  writeStore(store);
}
