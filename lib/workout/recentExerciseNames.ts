import type { JournalEntry } from "@/lib/types";

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Недавние уникальные названия упражнений клиента из журнала (новые сверху). */
export function collectRecentExerciseNamesForClient(
  journalEntries: readonly JournalEntry[],
  clientId: string,
  limit = 24,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const sorted = [...journalEntries].sort((a, b) => b.createdAtMs - a.createdAtMs);
  for (const entry of sorted) {
    if (entry.kind !== "workout" || entry.clientId !== clientId) continue;
    for (const ex of entry.exercises) {
      if (ex.skipped) continue;
      const display = ex.name.trim();
      if (display.length === 0) continue;
      const key = normalizeName(display);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(display);
      if (out.length >= limit) return out;
    }
  }
  return out;
}

export function filterExerciseNameSuggestions(names: readonly string[], query: string): string[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [...names];
  return names.filter((n) => n.toLowerCase().includes(q));
}
