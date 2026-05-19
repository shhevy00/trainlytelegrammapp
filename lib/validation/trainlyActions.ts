import type { JournalCompletedWorkout, JournalNoteEntry } from "@/lib/types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function nonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export function parseAddClientPayload(
  v: unknown,
): { ok: true; name: string; goal?: string; remainingSessions?: number; limitation?: string } | { ok: false } {
  if (!isRecord(v)) return { ok: false };
  if (!nonEmptyString(v.name)) return { ok: false };
  const out: { ok: true; name: string; goal?: string; remainingSessions?: number; limitation?: string } = {
    ok: true,
    name: v.name.trim(),
  };
  if (typeof v.goal === "string" && v.goal.trim().length > 0) out.goal = v.goal.trim();
  if (typeof v.limitation === "string" && v.limitation.trim().length > 0) {
    out.limitation = v.limitation.trim();
  }
  if (typeof v.remainingSessions === "number" && Number.isFinite(v.remainingSessions) && v.remainingSessions >= 0) {
    out.remainingSessions = Math.floor(v.remainingSessions);
  }
  return out;
}

export function parseJournalCompletedWorkout(v: unknown): JournalCompletedWorkout | null {
  if (!isRecord(v)) return null;
  if (v.kind !== "workout") return null;
  if (!nonEmptyString(v.id) || !nonEmptyString(v.clientId) || !nonEmptyString(v.title)) return null;
  if (typeof v.createdAtMs !== "number" || !Number.isFinite(v.createdAtMs)) return null;
  if (!Array.isArray(v.exercises)) return null;
  return v as unknown as JournalCompletedWorkout;
}

export function parseJournalNoteEntry(v: unknown): JournalNoteEntry | null {
  if (!isRecord(v)) return null;
  if (v.kind !== "note") return null;
  if (!nonEmptyString(v.id) || !nonEmptyString(v.clientId) || !nonEmptyString(v.title)) return null;
  if (typeof v.createdAtMs !== "number" || !Number.isFinite(v.createdAtMs)) return null;
  return v as unknown as JournalNoteEntry;
}
