import { and, eq, inArray } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { scheduleItems, workouts } from "@/db/schema";

type DbTx = Parameters<Parameters<AppDatabase["transaction"]>[0]>[0];

/** Удаляет черновики и незавершённые тренировки клиента перед записью в журнал. */
export async function deleteClientActiveWorkoutDrafts(
  tx: DbTx,
  trainerId: string,
  clientId: string,
): Promise<void> {
  await tx
    .delete(workouts)
    .where(
      and(
        eq(workouts.trainerId, trainerId),
        eq(workouts.clientId, clientId),
        inArray(workouts.status, ["draft", "in_progress"]),
      ),
    );
}

/** Проверяет, что слот расписания существует и ещё planned/upcoming; иначе null. */
export async function resolveLinkedScheduleItemId(
  tx: DbTx,
  trainerId: string,
  clientId: string,
  scheduleItemId: string | null | undefined,
): Promise<string | null> {
  let linkedScheduleId: string | null = scheduleItemId ?? null;
  if (linkedScheduleId == null) return null;
  const slotRows = await tx
    .select({ id: scheduleItems.id })
    .from(scheduleItems)
    .where(
      and(
        eq(scheduleItems.id, linkedScheduleId),
        eq(scheduleItems.trainerId, trainerId),
        eq(scheduleItems.clientId, clientId),
        inArray(scheduleItems.status, ["planned", "upcoming"]),
      ),
    )
    .limit(1);
  if (slotRows.length === 0) {
    linkedScheduleId = null;
  }
  return linkedScheduleId;
}

export async function markScheduleItemCompleted(
  tx: DbTx,
  trainerId: string,
  linkedScheduleId: string,
): Promise<void> {
  await tx
    .update(scheduleItems)
    .set({ status: "completed", updatedAt: new Date() })
    .where(
      and(
        eq(scheduleItems.id, linkedScheduleId),
        eq(scheduleItems.trainerId, trainerId),
        inArray(scheduleItems.status, ["planned", "upcoming"]),
      ),
    );
}
