/**
 * Наполняет локальную/стейджинг БД демо-данными Trainly.
 * Не запускать на production без `TRAINLY_ALLOW_SEED=true`.
 */
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@/db/schema";
import { trainers } from "@/db/schema";
import { ensureTrainerForTelegramUser } from "@/lib/server/ensureTrainer";
import {
  dbAcceptLegal,
  dbAddClient,
  dbAddScheduleSlot,
  dbCreateWorkoutTemplate,
} from "@/lib/server/trainlyMutations";
import { loadRepoEnvFiles } from "./loadRepoEnv";

loadRepoEnvFiles();

const SEED_TELEGRAM_ID = BigInt("8888888888888");

async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production" && process.env.TRAINLY_ALLOW_SEED !== "true") {
    throw new Error("Отказ: seed на production только с TRAINLY_ALLOW_SEED=true");
  }
  const url = process.env.DATABASE_URL;
  if (url == null || url.length === 0) {
    throw new Error("DATABASE_URL не задан");
  }

  const pool = new pg.Pool({ connectionString: url });
  const db = drizzle(pool, { schema });

  await db.delete(trainers).where(eq(trainers.telegramUserId, SEED_TELEGRAM_ID));
  const { trainerId } = await ensureTrainerForTelegramUser(db, {
    telegramUserId: SEED_TELEGRAM_ID,
    displayName: "Seed тренер",
  });
  await dbAcceptLegal(db, trainerId);

  const c1 = await dbAddClient(db, trainerId, {
    name: "Анна Seed",
    goal: "Сила",
    remainingSessions: 4,
    limitation: undefined,
  });
  const c2 = await dbAddClient(db, trainerId, {
    name: "Иван Seed",
    goal: "Выносливость",
    remainingSessions: 2,
  });

  const tpl = await dbCreateWorkoutTemplate(db, trainerId, {
    clientId: c1,
    name: "Ноги (seed)",
    exercises: [
      { name: "Жим ногами", plannedSets: 3 },
      { name: "Разгибания", plannedSets: 2 },
    ],
  });
  if (!tpl.ok) {
    throw new Error(`seed template: ${tpl.errors.join(", ")}`);
  }

  const s1 = await dbAddScheduleSlot(db, trainerId, {
    clientId: c1,
    dateIso: "2026-06-01",
    time: "10:00",
    title: "Силовая",
    durationMinutes: 60,
  });
  if (!s1.ok) throw new Error(`seed schedule: ${s1.error}`);

  const s2 = await dbAddScheduleSlot(db, trainerId, {
    clientId: c2,
    dateIso: "2026-06-02",
    time: "18:30",
    title: "Кардио",
    durationMinutes: 45,
  });
  if (!s2.ok) throw new Error(`seed schedule: ${s2.error}`);

  await pool.end();
  console.log("db:seed OK — trainerId:", trainerId, "clients:", c1, c2);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
