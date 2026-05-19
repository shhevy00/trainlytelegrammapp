export type RestTimerSec = 0 | 60 | 90 | 120;

const STORAGE_KEY = "trainly-rest-timer-sec-v1";

const ALLOWED: readonly RestTimerSec[] = [0, 60, 90, 120];

export function isRestTimerSec(v: number): v is RestTimerSec {
  return (ALLOWED as readonly number[]).includes(v);
}

export function readRestTimerPreference(): RestTimerSec {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw == null) return 0;
    const n = Number.parseInt(raw, 10);
    return isRestTimerSec(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function writeRestTimerPreference(sec: RestTimerSec): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(sec));
  } catch {
    /* private mode */
  }
}

export const REST_TIMER_OPTIONS: ReadonlyArray<{ value: RestTimerSec; label: string }> = [
  { value: 0, label: "Выкл" },
  { value: 60, label: "60с" },
  { value: 90, label: "90с" },
  { value: 120, label: "120с" },
];
