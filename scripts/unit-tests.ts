/**
 * Лёгкие unit-проверки без БД (CI + локально).
 * Запуск: npm run test:unit
 */
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { validateTelegramWebAppInitData } from "../lib/auth/telegram";
import {
  canOverrideSubscriptionStatusInRuntime,
  canTrainerWriteCoreProduct,
  parseTrainerProductAccessStatus,
} from "../lib/billing/accessGate";
import { canTrainerAddClient, maxActiveClientsForAccess } from "../lib/billing/planLimits";
import { isTrainlyProtectedAppRoute } from "../lib/config/trainlyRouteAccess";
import {
  accessValidDaysForBillingPeriod,
  getPaidPlanCheckoutQuote,
  getPlanPriceUi,
  maxYearlySavingsPercent,
  paidPlanYearlySavingsPercent,
  parseBillingPeriodParam,
  trainlyPaidPlanLabelFromDb,
} from "../lib/billing/planDefinitions";
import {
  computeWorkoutVolumeKg,
  countFilledSetsWorkout,
  isFilledSet,
} from "../lib/workout/calculations";
import { workoutExerciseIdForPostgres } from "../lib/workout/ids";
import { spendOneClientSessionBalance } from "../lib/coach/paidSessions";
import { buildWorkoutLiveSessionStats, formatWorkoutElapsedMs } from "../lib/workout/liveSessionStats";
import {
  formatSetReferenceLabel,
  normalizeLegacySetSummaryPart,
  splitSetSummaryParts,
} from "../lib/workout/formatSetDisplay";
import type { WorkoutExercise, WorkoutSetRow } from "../lib/workout/types";
import { recomputeJournalWorkoutStats } from "../lib/journal/journalEntryStats";
import { validateJournalWorkoutUpdate } from "../lib/journal/validateJournalUpdate";
import { countClientsWithSessionDebt } from "../lib/overview/overviewDayKpis";
import {
  filterScheduleCalendarItems,
  resolveScheduleDayListState,
} from "../lib/schedule/scheduleCalendar";
import {
  collectRecentExerciseNamesForClient,
  filterExerciseNameSuggestions,
} from "../lib/workout/recentExerciseNames";
import { isRestTimerSec, readRestTimerPreference } from "../lib/workout/restTimerPreference";
import { resolvePersistedWorkoutId } from "../lib/workout/resolvePersistedWorkoutId";
import { isMockSubscriptionWriteBlocked } from "../lib/billing/productAccessUi";
import type { WorkoutLoggerBootstrap } from "../lib/workout/templates";
import { overviewGreeting } from "../lib/overview/overviewGreeting";
import { buildOverviewRememberChips } from "../lib/overview/overviewRememberChips";
import { formatLastWorkoutCompact } from "../lib/overview/preWorkoutContext";
import type { MockClient, MockScheduleItem } from "../lib/mock/data";

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

assert.equal(parseBillingPeriodParam("year"), "year");
assert.equal(parseBillingPeriodParam("annual"), "year");
assert.equal(parseBillingPeriodParam(null), "month");
assert.equal(getPaidPlanCheckoutQuote("pro", "month").amountRub, 1490);
assert.equal(getPaidPlanCheckoutQuote("pro", "year").amountRub, 14900);
assert.equal(accessValidDaysForBillingPeriod("month"), 30);
assert.equal(accessValidDaysForBillingPeriod("year"), 365);
assert.equal(paidPlanYearlySavingsPercent("start"), 17);
assert.equal(maxYearlySavingsPercent(), 17);
assert.match(getPlanPriceUi("start", "month").altLine ?? "", /575/);
assert.match(getPlanPriceUi("start", "year").chargeLine ?? "", /6\s?900.*за год/);

assert.equal(validateJournalWorkoutUpdate({ title: "", durationMin: 10, workoutComment: "", exercises: [] }).length, 1);
const journalStats = recomputeJournalWorkoutStats([
  {
    id: "ex1",
    name: "Жим",
    comment: "",
    skipped: false,
    sets: [row({ weight: "50", reps: "10", done: true })],
  },
]);
assert.equal(journalStats.filledSetCount, 1);
assert.equal(journalStats.volumeKg, 500);

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

// --- live session stats ---
assert.equal(formatWorkoutElapsedMs(65_000), "1:05");
assert.equal(formatWorkoutElapsedMs(0), "0:00");
const liveStats = buildWorkoutLiveSessionStats(
  [ex({ sets: [row({ weight: "10", reps: "5", done: true })] })],
  90_000,
);
assert.equal(liveStats.filledSets, 1);
assert.equal(liveStats.exerciseCount, 1);
assert.equal(liveStats.volumeLabel, "50 кг");
assert.equal(liveStats.elapsedLabel, "1:30");
const emptyLive = buildWorkoutLiveSessionStats([], 0);
assert.equal(emptyLive.filledSets, 0);
assert.equal(emptyLive.volumeLabel, "—");

assert.equal(
  formatSetReferenceLabel({
    id: "s1",
    setType: "working",
    weight: "1",
    reps: "1",
    durationSec: "",
    comment: "",
    done: false,
    isDrop: false,
    parentSetId: null,
  }),
  "1 кг × 1 повт",
);
assert.equal(normalizeLegacySetSummaryPart("110×10"), "110 кг × 10 повт");
assert.equal(splitSetSummaryParts("1×1 · 2×3")[0], "1 кг × 1 повт");

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
assert.equal(parseTrainerProductAccessStatus("unknown_xyz"), "expired");
assert.equal(canTrainerAddClient({ accessStatus: "active", planCode: "pro", activeClientCount: 29 }).ok, true);
assert.equal(canTrainerAddClient({ accessStatus: "active", planCode: "pro", activeClientCount: 30 }).ok, false);
assert.equal(canTrainerAddClient({ accessStatus: "active", planCode: "max", activeClientCount: 79 }).ok, true);
assert.equal(maxActiveClientsForAccess("active", "max"), 80);
assert.equal(typeof canOverrideSubscriptionStatusInRuntime(), "boolean");

// --- route access (синхрон с app routes) ---
assert.equal(isTrainlyProtectedAppRoute("/welcome"), false);
assert.equal(isTrainlyProtectedAppRoute("/overview"), true);
assert.equal(isTrainlyProtectedAppRoute("/auth/error"), false);
assert.equal(isTrainlyProtectedAppRoute("/profile/setup"), false);
assert.equal(isTrainlyProtectedAppRoute("/billing/plans"), false);
assert.equal(isTrainlyProtectedAppRoute("/billing/success"), true);
assert.equal(isTrainlyProtectedAppRoute("/unknown-route-xyz"), false);

// --- overview remember chips ---
function mockClient(partial: Partial<MockClient>): MockClient {
  return {
    id: "cx",
    name: "Test Client",
    remainingSessions: 3,
    inactiveDays: 0,
    hasWorkoutToday: false,
    hasNextWorkoutScheduled: true,
    completedWorkoutsCount: 5,
    ...partial,
  };
}

const mockSlot: MockScheduleItem = {
  id: "s1",
  clientId: "cx",
  clientName: "Test Client",
  date: "2026-05-11",
  time: "10:00",
  durationMinutes: 60,
  title: "Силовая",
  status: "planned",
};

assert.equal(formatLastWorkoutCompact("2 дня назад · Ноги"), "Прошлая: 2 дня назад");

const debtChips = buildOverviewRememberChips(
  mockClient({ remainingSessions: -2, limitation: "Колено — без выпадов", lastWorkoutSummary: "3 дня назад · Верх" }),
  mockSlot,
);
assert.ok(debtChips.some((c) => c.label === "Долг 2" && c.tone === "warning"));

const firstChips = buildOverviewRememberChips(
  mockClient({ completedWorkoutsCount: 0, remainingSessions: 1, goal: "Сила" }),
  mockSlot,
);
assert.ok(firstChips.some((c) => c.label === "Первая тренировка"));
assert.ok(firstChips.length >= 2 && firstChips.length <= 3);

const noLimChips = buildOverviewRememberChips(
  mockClient({ limitation: undefined, remainingSessions: 4 }),
  mockSlot,
);
assert.ok(!noLimChips.some((c) => c.id === "limitation"));
assert.equal(noLimChips.length <= 3, true);

assert.equal(overviewGreeting(new Date(2026, 4, 17, 10, 0, 0)), "Доброе утро");
assert.equal(overviewGreeting(new Date(2026, 4, 17, 14, 0, 0)), "Добрый день");
assert.equal(overviewGreeting(new Date(2026, 4, 17, 20, 0, 0)), "Добрый вечер");

assert.equal(
  countClientsWithSessionDebt([
    mockClient({ id: "a", remainingSessions: 2 }),
    mockClient({ id: "b", remainingSessions: -1 }),
    mockClient({ id: "c", remainingSessions: 0 }),
  ]),
  1,
);

const schedRow = (status: MockScheduleItem["status"], id: string): MockScheduleItem => ({
  id,
  clientId: "c1",
  clientName: "Test",
  date: "2026-05-14",
  time: "10:00",
  durationMinutes: 60,
  title: "Legs",
  status,
});

assert.equal(filterScheduleCalendarItems([schedRow("completed", "a"), schedRow("planned", "b")]).length, 1);
assert.equal(resolveScheduleDayListState([schedRow("completed", "a")]).kind, "all_done");
assert.equal(resolveScheduleDayListState([]).kind, "empty");
assert.equal(resolveScheduleDayListState([schedRow("planned", "b")]).kind, "list");

const bootstrapWithId: WorkoutLoggerBootstrap = {
  session: {
    clientId: "c1",
    clientName: "A",
    title: "T",
    workoutComment: "",
    startedAtMs: 1,
    exercises: [],
  },
  referenceHintsByExerciseName: {},
  rememberBlock: "",
  persistedWorkoutId: "00000000-0000-4000-8000-000000000001",
};
assert.equal(resolvePersistedWorkoutId(bootstrapWithId), "00000000-0000-4000-8000-000000000001");
const generated = resolvePersistedWorkoutId({
  ...bootstrapWithId,
  persistedWorkoutId: undefined,
});
assert.ok(generated.length > 8);

const journalUpdateErrors = validateJournalWorkoutUpdate({
  title: "",
  durationMin: 0,
  workoutComment: "",
  exercises: [],
});
assert.ok(journalUpdateErrors.length >= 2);

assert.deepEqual(
  collectRecentExerciseNamesForClient(
    [
      {
        kind: "workout",
        id: "w1",
        clientId: "c1",
        clientName: "A",
        title: "T",
        createdAtMs: 100,
        durationMin: 30,
        status: "completed",
        workoutComment: "",
        exercises: [
          { id: "e1", name: "Жим", comment: "", skipped: false, sets: [] },
          { id: "e2", name: "жим", comment: "", skipped: false, sets: [] },
        ],
        filledSetCount: 1,
        volumeKg: 100,
        summaryHint: "",
      },
    ],
    "c1",
  ),
  ["Жим"],
);
assert.deepEqual(filterExerciseNameSuggestions(["Жим лёжа", "Присед"], "жим"), ["Жим лёжа"]);
assert.equal(isRestTimerSec(90), true);
assert.equal(isRestTimerSec(45), false);
assert.equal(readRestTimerPreference(), 0);
assert.equal(isMockSubscriptionWriteBlocked("expired"), true);
assert.equal(isMockSubscriptionWriteBlocked("active"), false);

console.log("unit-tests: ok");
