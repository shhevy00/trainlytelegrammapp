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

export function newWorkoutId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `w_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
