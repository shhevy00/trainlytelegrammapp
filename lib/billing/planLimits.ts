import { normalizePaidPlanSlug, PAID_PLAN_CHECKOUT, type PaidPlanSlug } from "@/lib/billing/planDefinitions";
import type { TrainlyProductAccessStatus } from "@/lib/trainly/snapshotTypes";

export class TrainlyClientLimitError extends Error {
  readonly limit: number;

  constructor(limit: number) {
    super("trainly_client_limit_reached");
    this.name = "TrainlyClientLimitError";
    this.limit = limit;
  }
}

const LIMIT_BY_PLAN: Record<PaidPlanSlug, number> = {
  start: PAID_PLAN_CHECKOUT.start.clientLimit,
  pro: PAID_PLAN_CHECKOUT.pro.clientLimit,
  expert: PAID_PLAN_CHECKOUT.expert.clientLimit,
};

/** Лимит бесплатного / пробного доступа (Free). */
const FREE_TIER_LIMIT = 2;

export function maxActiveClientsForAccess(
  accessStatus: TrainlyProductAccessStatus,
  planCode: string | null | undefined,
): number | null {
  if (accessStatus === "demo_unlimited") return null;
  if (accessStatus === "expired" || accessStatus === "cancelled") return 0;
  if (accessStatus === "trial") return FREE_TIER_LIMIT;
  if (accessStatus === "active") {
    const slug = normalizePaidPlanSlug(planCode);
    if (slug != null) return LIMIT_BY_PLAN[slug];
    if (planCode?.trim().toLowerCase() === "free") return FREE_TIER_LIMIT;
    return FREE_TIER_LIMIT;
  }
  return 0;
}

export function canTrainerAddClient(params: {
  accessStatus: TrainlyProductAccessStatus;
  planCode: string | null | undefined;
  activeClientCount: number;
}): { ok: true } | { ok: false; limit: number } {
  const limit = maxActiveClientsForAccess(params.accessStatus, params.planCode);
  if (limit == null) return { ok: true };
  if (params.activeClientCount >= limit) {
    return { ok: false, limit };
  }
  return { ok: true };
}
