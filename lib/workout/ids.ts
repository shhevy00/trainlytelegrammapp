/** Хвост `ex-<uuid>` (старый UI) должен совпадать с форматом UUID для Postgres. */
const UUID_AFTER_PREFIX_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * `workout_exercises.id` в БД — uuid. Раньше UI задавал `ex-<uuid>` для якорей;
 * при вставке в Postgres нужен чистый UUID.
 */
export function workoutExerciseIdForPostgres(id: string): string {
  if (id.startsWith("ex-")) {
    const rest = id.slice(3);
    if (UUID_AFTER_PREFIX_RE.test(rest)) return rest;
  }
  return id;
}

function randomBase36Suffix(byteCount: number): string {
  const bytes = new Uint8Array(byteCount);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 12);
}

export function newWorkoutId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `w_${Date.now().toString(36)}_${randomBase36Suffix(8)}`;
}
