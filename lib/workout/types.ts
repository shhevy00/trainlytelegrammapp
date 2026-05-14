export type WorkoutSetType = "working" | "warmup" | "drop" | "failure" | "amrap" | "time";

export interface WorkoutSetRow {
  id: string;
  setType: WorkoutSetType;
  weight: string;
  reps: string;
  durationSec: string;
  comment: string;
  done: boolean;
  /** MVP: visual hint only; full nested drop rules deferred (see TODO in UI). */
  isDrop: boolean;
  parentSetId: string | null;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  comment: string;
  skipped: boolean;
  sets: WorkoutSetRow[];
}

export interface WorkoutSessionState {
  clientId: string;
  clientName: string;
  title: string;
  workoutComment: string;
  exercises: WorkoutExercise[];
  startedAtMs: number;
  /** Плановый слот (mock); при сохранении тренировки слот становится completed и получает workoutId. */
  scheduleItemId?: string;
  /** Тренер явно подтвердил старт при нуле/долге (экран старта). Не влияет на списание в mock MVP — занятие всё равно списывается при завершении. */
  debtAcknowledged?: boolean;
}
