import { and, asc, eq, inArray } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { workoutExercises, workoutSets, workouts } from "@/db/schema";
import type { WorkoutExercise, WorkoutSessionState, WorkoutSetRow } from "@/lib/workout/types";
import { workoutExerciseIdForPostgres } from "@/lib/workout/ids";

export interface PersistedWorkoutDraft {
  workoutId: string;
  session: WorkoutSessionState;
  status: "draft" | "in_progress";
  templateId: string | null;
}

export class ActiveWorkoutConflictError extends Error {
  readonly existingWorkoutId: string;

  constructor(existingWorkoutId: string) {
    super("active_workout_exists");
    this.name = "ActiveWorkoutConflictError";
    this.existingWorkoutId = existingWorkoutId;
  }
}

function mapSets(rows: (typeof workoutSets.$inferSelect)[]): WorkoutSetRow[] {
  return rows.map((r) => ({
    id: r.id,
    setType: r.setType,
    weight: r.weight,
    reps: r.reps,
    durationSec: r.durationSec,
    comment: r.comment,
    done: r.done,
    isDrop: r.isDrop,
    parentSetId: r.parentSetId,
  }));
}

export async function dbReplaceWorkoutStructure(
  tx: Parameters<Parameters<AppDatabase["transaction"]>[0]>[0],
  trainerId: string,
  workoutId: string,
  exercises: WorkoutExercise[],
): Promise<void> {
  await tx.delete(workoutExercises).where(eq(workoutExercises.workoutId, workoutId));
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i]!;
    const exerciseRowId = workoutExerciseIdForPostgres(ex.id);
    await tx.insert(workoutExercises).values({
      id: exerciseRowId,
      trainerId,
      workoutId,
      orderIndex: i,
      name: ex.name,
      comment: ex.comment,
      skipped: ex.skipped,
    });
    for (const set of ex.sets) {
      await tx.insert(workoutSets).values({
        id: set.id,
        trainerId,
        workoutExerciseId: exerciseRowId,
        setType: set.setType,
        weight: set.weight,
        reps: set.reps,
        durationSec: set.durationSec,
        comment: set.comment,
        done: set.done,
        isDrop: set.isDrop,
        parentSetId: set.parentSetId,
      });
    }
  }
}

export async function dbUpsertActiveWorkout(
  db: AppDatabase,
  trainerId: string,
  payload: {
    workoutId: string;
    session: WorkoutSessionState;
    status: "draft" | "in_progress";
    templateId?: string | null;
  },
): Promise<void> {
  const { workoutId, session, status, templateId = null } = payload;
  try {
    await db.transaction(async (tx) => {
      const otherActive = await tx
        .select({ id: workouts.id })
        .from(workouts)
        .where(
          and(
            eq(workouts.trainerId, trainerId),
            eq(workouts.clientId, session.clientId),
            inArray(workouts.status, ["draft", "in_progress"]),
          ),
        )
        .limit(2);
      const conflict = otherActive.find((r) => r.id !== workoutId);
      if (conflict != null) {
        throw new ActiveWorkoutConflictError(conflict.id);
      }

      const existing = await tx
        .select({ id: workouts.id })
        .from(workouts)
        .where(and(eq(workouts.id, workoutId), eq(workouts.trainerId, trainerId)))
        .limit(1);

      if (existing.length === 0) {
        await tx.insert(workouts).values({
          id: workoutId,
          trainerId,
          clientId: session.clientId,
          scheduleItemId: session.scheduleItemId ?? null,
          templateId,
          status,
          title: session.title,
          workoutComment: session.workoutComment,
          startedAt: new Date(session.startedAtMs),
          debtAcknowledged: session.debtAcknowledged ?? false,
        });
      } else {
        await tx
          .update(workouts)
          .set({
            clientId: session.clientId,
            scheduleItemId: session.scheduleItemId ?? null,
            templateId,
            status,
            title: session.title,
            workoutComment: session.workoutComment,
            startedAt: new Date(session.startedAtMs),
            debtAcknowledged: session.debtAcknowledged ?? false,
            updatedAt: new Date(),
          })
          .where(and(eq(workouts.id, workoutId), eq(workouts.trainerId, trainerId)));
      }

      await dbReplaceWorkoutStructure(tx, trainerId, workoutId, session.exercises);
    });
  } catch (e) {
    if (e instanceof ActiveWorkoutConflictError) throw e;
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("workouts_one_active_logger_per_trainer_client")) {
      const row = await db
        .select({ id: workouts.id })
        .from(workouts)
        .where(
          and(
            eq(workouts.trainerId, trainerId),
            eq(workouts.clientId, session.clientId),
            inArray(workouts.status, ["draft", "in_progress"]),
          ),
        )
        .limit(1);
      if (row[0]) throw new ActiveWorkoutConflictError(row[0].id);
    }
    throw e;
  }
}

export async function dbLoadActiveWorkout(
  db: AppDatabase,
  trainerId: string,
  clientId: string,
): Promise<PersistedWorkoutDraft | null> {
  const rows = await db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.trainerId, trainerId),
        eq(workouts.clientId, clientId),
        inArray(workouts.status, ["draft", "in_progress"]),
      ),
    )
    .orderBy(asc(workouts.updatedAt))
    .limit(1);
  const w = rows[0];
  if (w == null) return null;

  const exRows = await db
    .select()
    .from(workoutExercises)
    .where(eq(workoutExercises.workoutId, w.id))
    .orderBy(asc(workoutExercises.orderIndex));
  const exerciseIds = exRows.map((e) => e.id);
  const setRows =
    exerciseIds.length === 0
      ? []
      : await db.select().from(workoutSets).where(inArray(workoutSets.workoutExerciseId, exerciseIds));

  const setsByExercise = new Map<string, (typeof workoutSets.$inferSelect)[]>();
  for (const s of setRows) {
    const list = setsByExercise.get(s.workoutExerciseId) ?? [];
    list.push(s);
    setsByExercise.set(s.workoutExerciseId, list);
  }

  const exercises: WorkoutExercise[] = exRows.map((ex) => ({
    id: ex.id,
    name: ex.name,
    comment: ex.comment,
    skipped: ex.skipped,
    sets: mapSets(setsByExercise.get(ex.id) ?? []),
  }));

  const session: WorkoutSessionState = {
    clientId: w.clientId,
    clientName: "",
    title: w.title,
    workoutComment: w.workoutComment,
    exercises,
    startedAtMs: w.startedAt.getTime(),
    ...(w.scheduleItemId ? { scheduleItemId: w.scheduleItemId } : {}),
    ...(w.debtAcknowledged ? { debtAcknowledged: true } : {}),
  };

  return {
    workoutId: w.id,
    session,
    status: w.status === "in_progress" ? "in_progress" : "draft",
    templateId: w.templateId,
  };
}

export async function dbDeleteActiveWorkout(
  db: AppDatabase,
  trainerId: string,
  workoutId: string,
): Promise<void> {
  await db
    .delete(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.trainerId, trainerId),
        inArray(workouts.status, ["draft", "in_progress"]),
      ),
    );
}

export async function dbClearActiveWorkoutsForClient(
  db: AppDatabase,
  trainerId: string,
  clientId: string,
): Promise<void> {
  await db
    .delete(workouts)
    .where(
      and(
        eq(workouts.trainerId, trainerId),
        eq(workouts.clientId, clientId),
        inArray(workouts.status, ["draft", "in_progress"]),
      ),
    );
}
