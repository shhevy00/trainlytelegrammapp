/**
 * Лёгкие unit-проверки без БД (CI + локально).
 * Запуск: npm run test:unit
 */
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { validateTelegramWebAppInitData } from "../lib/auth/telegram";
import { canTrainerWriteCoreProduct, parseTrainerProductAccessStatus } from "../lib/billing/accessGate";
import { isTrainlyProtectedAppRoute } from "../lib/config/trainlyRouteAccess";
import { trainlyPaidPlanLabelFromDb } from "../lib/billing/planDefinitions";
import {
  computeWorkoutVolumeKg,
  countFilledSetsWorkout,
  isFilledSet,
} from "../lib/workout/calculations";
import { workoutExerciseIdForPostgres } from "../lib/workout/ids";
import { spendOneClientSessionBalance } from "../lib/coach/paidSessions";
import type { WorkoutExercise, WorkoutSetRow } from "../lib/workout/types";

function row(partial: Partial<WorkoutSetRow>): WorkoutSetRow {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    setType: "working",
    weight: "",
    reps: "",
    durationSec: "",
    comment: "",
    done: false,
    isDrop: false,
    parentSetId: null,
    ...partial,
  };
}

function ex(partial: Partial<WorkoutExercise>): WorkoutExercise {
  return {
    id: "00000000-0000-4000-8000-0000000000aa",
    name: "Test",
    comment: "",
    skipped: false,
    sets: [row({ weight: "10", reps: "5", done: true })],
    ...partial,
  };
}

// --- access gate ---
assert.equal(canTrainerWriteCoreProduct(undefined), true);

const future = new Date(Date.now() + 86_400_000);
const past = new Date(Date.now() - 86_400_000);

assert.equal(canTrainerWriteCoreProduct({ accessStatus: "demo_unlimited", validUntil: null }), true);
assert.equal(canTrainerWriteCoreProduct({ accessStatus: "active", validUntil: future }), true);
assert.equal(canTrainerWriteCoreProduct({ accessStatus: "trial", validUntil: future }), true);
assert.equal(canTrainerWriteCoreProduct({ accessStatus: "active", validUntil: past }), false);
assert.equal(canTrainerWriteCoreProduct({ accessStatus: "trial", validUntil: past }), false);
assert.equal(canTrainerWriteCoreProduct({ accessStatus: "expired", validUntil: null }), false);
assert.equal(canTrainerWriteCoreProduct({ accessStatus: "cancelled", validUntil: future }), false);

assert.equal(trainlyPaidPlanLabelFromDb("pro"), "Pro");
assert.equal(trainlyPaidPlanLabelFromDb(null), "не указан");
assert.equal(trainlyPaidPlanLabelFromDb("unknown_x"), "unknown_x");

// --- paid sessions ---
assert.equal(spendOneClientSessionBalance(5), 4);
assert.equal(spendOneClientSessionBalance(0), -1);

// --- exercise id for postgres ---
const u = "f4c2d13d-a4b9-4e64-a9ca-1895000fca99";
assert.equal(workoutExerciseIdForPostgres(`ex-${u}`), u);
assert.equal(workoutExerciseIdForPostgres(u), u);

// --- filled set / volume ---
assert.equal(isFilledSet(row({ weight: "10", reps: "8" })), true);
assert.equal(isFilledSet(row({ weight: "", reps: "", done: false })), false);

assert.equal(countFilledSetsWorkout([ex({ skipped: true }), ex({})]), 1);
assert.equal(computeWorkoutVolumeKg([ex({ sets: [row({ weight: "2", reps: "3" })] })]), 6);
assert.equal(computeWorkoutVolumeKg([ex({ sets: [row({ weight: "", reps: "10" })] })]), null);

// --- Telegram initData (без реального бота; детерминированный HMAC) ---
function makeTelegramInitData(botToken: string, userId: number, authDateSec: number): string {
  const params = new URLSearchParams();
  params.set("user", JSON.stringify({ id: userId }));
  params.set("auth_date", String(authDateSec));
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const hash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  params.set("hash", hash);
  return params.toString();
}

const fakeBotToken = "123456789:abcdefghijklmnopqrstuvwxyzABCD";
const authNowSec = Math.floor(Date.now() / 1000);
const tgUser = validateTelegramWebAppInitData(
  makeTelegramInitData(fakeBotToken, 42, authNowSec),
  fakeBotToken,
  3600,
);
assert.equal(tgUser.id, 42);
assert.throws(() =>
  validateTelegramWebAppInitData(
    makeTelegramInitData(fakeBotToken, 1, authNowSec),
    "999999999:ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ",
    3600,
  ),
);

// --- product access parse ---
assert.equal(parseTrainerProductAccessStatus("active"), "active");
assert.equal(parseTrainerProductAccessStatus("unknown_xyz"), "demo_unlimited");

// --- route access (синхрон с app routes) ---
assert.equal(isTrainlyProtectedAppRoute("/welcome"), false);
assert.equal(isTrainlyProtectedAppRoute("/overview"), true);
assert.equal(isTrainlyProtectedAppRoute("/auth/error"), false);
assert.equal(isTrainlyProtectedAppRoute("/profile/setup"), false);
assert.equal(isTrainlyProtectedAppRoute("/billing/plans"), false);
assert.equal(isTrainlyProtectedAppRoute("/billing/success"), true);
assert.equal(isTrainlyProtectedAppRoute("/unknown-route-xyz"), false);

console.log("unit-tests: ok");
