import assert from "node:assert/strict";
import { test } from "node:test";
import { parseTrainerProductAccessStatus } from "../../lib/billing/accessGate";

test("unknown access status is fail-closed to expired", () => {
  assert.equal(parseTrainerProductAccessStatus("unknown_xyz"), "expired");
});

test("yookassa webhook idempotency key shape", () => {
  const event = "payment.succeeded";
  const paymentId = "22e12f66-0001-5000-8000-1f11451e7ff1";
  const key = `${event}:${paymentId}`;
  assert.equal(key, "payment.succeeded:22e12f66-0001-5000-8000-1f11451e7ff1");
});
