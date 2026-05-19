import type { MockSubscriptionStatus } from "@/lib/mock/lifecycleTypes";
import type { TrainlyProductAccessStatus } from "@/lib/trainly/snapshotTypes";

export function isMockSubscriptionWriteBlocked(status: MockSubscriptionStatus): boolean {
  return status === "expired" || status === "cancelled";
}

export function isTrainlyAccessWriteBlocked(status: TrainlyProductAccessStatus): boolean {
  return status === "expired" || status === "cancelled";
}
