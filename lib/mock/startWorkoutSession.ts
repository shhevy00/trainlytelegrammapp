import type { MockClient } from "@/lib/mock/data";
import type { WorkoutSessionState } from "@/lib/workout/types";

export function createEmptyWorkoutSessionForClient(
  client: MockClient,
  title: string,
  scheduleItemId?: string,
  opts?: { debtAcknowledged?: boolean },
): WorkoutSessionState {
  return {
    clientId: client.id,
    clientName: client.name,
    title,
    workoutComment: "",
    startedAtMs: Date.now(),
    exercises: [],
    ...(scheduleItemId ? { scheduleItemId } : {}),
    ...(opts?.debtAcknowledged ? { debtAcknowledged: true } : {}),
  };
}
