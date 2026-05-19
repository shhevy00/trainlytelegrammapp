import { isTrainlyMockDataSource } from "@/lib/config/dataSource";
import type { TrainlyProductAccessStatus } from "@/lib/trainly/snapshotTypes";

export class TrainlyProductAccessDeniedError extends Error {
  constructor(message = "trainly_product_access_denied") {
    super(message);
    this.name = "TrainlyProductAccessDeniedError";
  }
}

export function parseTrainerProductAccessStatus(v: string): TrainlyProductAccessStatus {
  if (
    v === "demo_unlimited" ||
    v === "trial" ||
    v === "active" ||
    v === "expired" ||
    v === "cancelled"
  ) {
    return v;
  }
  return "expired";
}

/** Разрешена ли ручная смена подписки через server action (только mock в non-production). */
export function canOverrideSubscriptionStatusInRuntime(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  try {
    return isTrainlyMockDataSource();
  } catch {
    return false;
  }
}

export interface TrainerProductAccessRow {
  accessStatus: string;
  validUntil: Date | null;
}

/**
 * Разрешены ли мутации основного продукта (клиенты, тренировки, расписание и т.д.).
 * Trial/active с истёкшим `validUntil` считаются истёкшими.
 */
export function canTrainerWriteCoreProduct(access: TrainerProductAccessRow | undefined): boolean {
  if (access == null) return true;
  const st = access.accessStatus;
  if (st === "demo_unlimited") return true;
  if (st === "expired" || st === "cancelled") return false;
  const until = access.validUntil;
  if (until != null && until.getTime() < Date.now()) {
    return false;
  }
  if (st === "trial" || st === "active") return true;
  return false;
}
