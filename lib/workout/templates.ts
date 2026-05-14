import type { WorkoutExercise, WorkoutSessionState } from "@/lib/workout/types";
import { newWorkoutId } from "@/lib/workout/ids";
import { createEmptySetRow } from "@/lib/workout/rows";

/** Источник перехода в логгер (mock, до БД). */
export type WorkoutLoggerStartSource = "empty" | "schedule" | "repeat" | "template";

/** Bootstrap очереди логгера: сессия + справка + опционально шаблон/источник. */
export interface WorkoutLoggerBootstrap {
  session: WorkoutSessionState;
  referenceHintsByExerciseName: Record<string, string>;
  rememberBlock: string;
  startSource?: WorkoutLoggerStartSource;
  templateId?: string;
}

/** Шаблон тренировки (MVP: только в разрезе клиента, без «программы» и мезоциклов). */
export interface WorkoutTemplateExercise {
  id: string;
  templateId: string;
  name: string;
  orderIndex: number;
  plannedSets?: number | null;
  comment?: string;
}

export interface WorkoutTemplate {
  id: string;
  clientId: string;
  name: string;
  description?: string;
  exercises: WorkoutTemplateExercise[];
  createdAtIso: string;
  updatedAtIso: string;
  archivedAtIso?: string | null;
}

export interface CreateWorkoutTemplateInput {
  clientId: string;
  name: string;
  description?: string;
  exercises: Array<{
    name: string;
    plannedSets?: number | null;
    comment?: string;
  }>;
}

export interface UpdateWorkoutTemplateInput {
  name?: string;
  description?: string;
  exercises?: Array<{
    id?: string;
    name: string;
    plannedSets?: number | null;
    comment?: string;
  }>;
}

export function normalizeTemplateName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

function validateExerciseRows(
  exercises: ReadonlyArray<{ name: string; plannedSets?: number | null }>,
): string[] {
  const errors: string[] = [];
  if (exercises.length === 0) {
    errors.push("Добавьте хотя бы одно упражнение.");
    return errors;
  }
  for (let i = 0; i < exercises.length; i++) {
    const nm = normalizeTemplateName(exercises[i].name);
    if (nm.length === 0) {
      errors.push(`Упражнение ${i + 1}: укажите название.`);
    }
    const ps = exercises[i].plannedSets;
    if (ps != null) {
      if (!Number.isInteger(ps) || ps < 1 || ps > 20) {
        errors.push(`Упражнение ${i + 1}: количество подходов в плане должно быть целым числом от 1 до 20.`);
      }
    }
  }
  return errors;
}

/** Валидация создания шаблона тренировки; сообщения на русском. */
export function validateTemplateInput(input: CreateWorkoutTemplateInput): string[] {
  const errors: string[] = [];
  const name = normalizeTemplateName(input.name);
  if (name.length === 0) {
    errors.push("Укажите название шаблона тренировки.");
  }
  errors.push(...validateExerciseRows(input.exercises));
  return errors;
}

/** Валидация обновления шаблона (частичные поля). */
export function validateUpdateWorkoutTemplateInput(input: UpdateWorkoutTemplateInput): string[] {
  const errors: string[] = [];
  if (input.name !== undefined) {
    if (normalizeTemplateName(input.name).length === 0) {
      errors.push("Укажите название шаблона тренировки.");
    }
  }
  if (input.exercises !== undefined) {
    errors.push(...validateExerciseRows(input.exercises));
  }
  return errors;
}

function setRowCountForTemplateExercise(plannedSets: number | null | undefined): number {
  if (plannedSets == null) return 1;
  if (!Number.isInteger(plannedSets) || plannedSets < 1 || plannedSets > 20) return 1;
  return plannedSets;
}

/**
 * Собирает сессию логгера только из структуры шаблона (без весов/повторов/объёма).
 * Порядок упражнений — по orderIndex.
 */
export function buildWorkoutSessionFromTemplate(params: {
  template: WorkoutTemplate;
  clientId: string;
  clientName: string;
  titleOverride?: string;
  scheduleItemId?: string;
  debtAcknowledged?: boolean;
}): WorkoutSessionState {
  const { template, clientId, clientName, titleOverride, scheduleItemId, debtAcknowledged } = params;
  const title = titleOverride?.trim() ? normalizeTemplateName(titleOverride) : normalizeTemplateName(template.name);

  const sorted = [...template.exercises].sort((a, b) => a.orderIndex - b.orderIndex);

  const exercises: WorkoutExercise[] = sorted.map((tex) => {
    const rowCount = setRowCountForTemplateExercise(tex.plannedSets ?? null);
    const sets = Array.from({ length: rowCount }, () => createEmptySetRow());
    const exComment = tex.comment?.trim() ?? "";
    return {
      id: newWorkoutId(),
      name: normalizeTemplateName(tex.name),
      comment: exComment,
      skipped: false,
      sets,
    };
  });

  return {
    clientId,
    clientName,
    title,
    workoutComment: "",
    startedAtMs: Date.now(),
    exercises,
    ...(scheduleItemId ? { scheduleItemId } : {}),
    ...(debtAcknowledged ? { debtAcknowledged: true } : {}),
  };
}
