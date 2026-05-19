import assert from "node:assert/strict";
import { test } from "node:test";
import { canTrainerAddClient, maxActiveClientsForAccess } from "../../lib/billing/planLimits";

test("maxActiveClientsForAccess paid plans", () => {
  assert.equal(maxActiveClientsForAccess("active", "start"), 10);
  assert.equal(maxActiveClientsForAccess("active", "pro"), 30);
  assert.equal(maxActiveClientsForAccess("active", "expert"), 80);
  assert.equal(maxActiveClientsForAccess("active", "max"), 80);
  assert.equal(maxActiveClientsForAccess("trial", null), 2);
  assert.equal(maxActiveClientsForAccess("demo_unlimited", "pro"), null);
});

test("canTrainerAddClient blocks at limit", () => {
  assert.equal(canTrainerAddClient({ accessStatus: "active", planCode: "start", activeClientCount: 9 }).ok, true);
  assert.equal(canTrainerAddClient({ accessStatus: "active", planCode: "start", activeClientCount: 10 }).ok, false);
});
