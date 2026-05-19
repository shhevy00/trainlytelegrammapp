import {
  buildWorkoutSessionFromTemplate,
  type WorkoutLoggerBootstrap,
  type WorkoutTemplate,
} from "@/lib/workout/templates";

export function createWorkoutBootstrapFromTemplate(params: {
  clientId: string;
  templateId: string;
  client: { id: string; name: string } | undefined;
  template: WorkoutTemplate | undefined;
  scheduleItemId?: string;
  titleOverride?: string;
  debtAcknowledged?: boolean;
}): { ok: true; bootstrap: WorkoutLoggerBootstrap } | { ok: false; error: string } {
  const client = params.client;
  if (!client) return { ok: false, error: "Клиент не найден." };
  const template = params.template;
  if (!template) return { ok: false, error: "Шаблон тренировки не найден." };
  if (template.clientId !== params.clientId) {
    return { ok: false, error: "Шаблон не принадлежит выбранному клиенту." };
  }
  if (template.archivedAtIso) return { ok: false, error: "Шаблон в архиве." };
  const session = buildWorkoutSessionFromTemplate({
    template,
    clientId: client.id,
    clientName: client.name,
    titleOverride: params.titleOverride,
    scheduleItemId: params.scheduleItemId,
    ...(params.debtAcknowledged ? { debtAcknowledged: true } : {}),
  });
  return {
    ok: true,
    bootstrap: {
      session,
      referenceHintsByExerciseName: {},
      rememberBlock: "",
      startSource: "template",
      templateId: template.id,
    },
  };
}
