import { revalidatePath } from "next/cache";

/** Точечная инвалидация после мутаций домена Trainly (вместо revalidatePath("/")). */
export function revalidateTrainlyCorePaths(): void {
  revalidatePath("/overview");
  revalidatePath("/clients");
  revalidatePath("/journal");
  revalidatePath("/schedule");
  revalidatePath("/workout");
  revalidatePath("/start-workout");
}

export function revalidateTrainlyClientPaths(clientId?: string): void {
  revalidateTrainlyCorePaths();
  if (clientId != null && clientId.length > 0) {
    revalidatePath(`/clients/${clientId}`);
  }
}

export function revalidateTrainlyBillingPaths(): void {
  revalidatePath("/billing");
  revalidatePath("/billing/manage");
  revalidatePath("/billing/plans");
  revalidatePath("/overview");
}
